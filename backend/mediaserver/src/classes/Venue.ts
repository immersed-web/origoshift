import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';
import { Log } from 'debug-level';

const log = new Log('Venue');
process.env.DEBUG = 'Venue*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import {types as soupTypes} from 'mediasoup';
import { ConnectionId, UserId, VenueId, CameraId } from 'schemas';

import type { Prisma } from 'database';
import prisma from '../modules/prismaClient';

import { Camera, VrSpace, type UserClient, SenderClient  } from './InternalClasses';
import { VenueUpdate } from 'schemas/*';
// import { FilteredEvents } from 'trpc/trpc-utils';

const venueIncludeWhitelistVirtual  = {
  whitelistedUsers: {
    select: {
      userId: true
    }
  },
  virtualSpace: {include: {virtualSpace3DModel: true}},
} satisfies Prisma.VenueInclude;
const args = {include: venueIncludeWhitelistVirtual} satisfies Prisma.VenueArgs;
type VenueResponse = Prisma.VenueGetPayload<typeof args>

export class Venue {
  private constructor(prismaData: VenueResponse, router: soupTypes.Router){
    this.router = router;
    this.prismaData = prismaData;
    if(prismaData.virtualSpace){
      this.vrSpace = new VrSpace(this, prismaData.virtualSpace);
    }
  }

  private prismaData: VenueResponse;

  get venueId() {
    return this.prismaData.venueId as VenueId;
  }
  get name() { return this.prismaData.name; }
  // set name(data : VenueUpdate) {
  //   if(data.name) { this.prismaData.name = data.name;}
  //   // if(data.description) { this.prismaData = data.description;}

  //   prisma.venue.update({where: {venueId: this.prismaData.venueId}, data: this.prismaData});
  // }

  // TODO: We probably want to be able to have many owners for a venue in the future
  get ownerId() {
    return this.prismaData.ownerId as UserId;
  }

  router: soupTypes.Router;
  vrSpace?: VrSpace;

  cameras: Map<CameraId, Camera> = new Map();

  private clients: Map<ConnectionId, UserClient> = new Map();
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  private senderClients: Map<ConnectionId, SenderClient> = new Map();

  get _isEmpty() {
    return this.clients.size === 0 && this.senderClients.size === 0;
  }
  getPublicState() {
    const {venueId, name, clientIds, ownerId} = this;
    const cameras: Record<CameraId, ReturnType<Camera['getPublicState']>> = {};
    this.cameras.forEach(cam => cameras[cam.cameraId] = cam.getPublicState());
    return {
      venueId, name, clientIds, ownerId,
      vrSpace: this.vrSpace?.getPublicState(),
      cameras: cameras
    };
  }

  //
  // NOTE: It's important we release all references here!
  unload() {
    log.info(`unloading ${this.prismaData.name} (${this.venueId})`);
    this.emitToAllClients('venueWasUnloaded', this.venueId);
    this.router.close();
    // this.cameras.forEach(room => room.destroy());
    Venue.venues.delete(this.venueId);
    this.vrSpace?.unload();
  }

  async update (input: VenueUpdate) {
    if(input.name) { this.prismaData.name = input.name;}
    await prisma.venue.update({where: {venueId: this.prismaData.venueId}, data: input});
  }

  /**
   * adds a client to this venues collection of clients. Also takes care of assigning the venue inside the client itself
   * @param client the client instance to add to the venue
   */
  addClient ( client : UserClient){
    log.info(`Client ${client.username} added to the venue ${this.prismaData.name}`);
    // console.log('clients before add: ',this.clients);
    this.clients.set(client.connectionId, client);
    // console.log('clients after add: ',this.clients);
    client._setVenue(this.venueId);
    this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: true}, client.connectionId);
  }

  /**
   * Removes the client from the venue. Also automatically unloads the venue if it becomes empty
   * Also removes the client from camera or a vrSpace if its inside one
   */
  removeClient (client: UserClient) {
    log.info(`removing ${client.username} (${client.connectionId}) from the venue ${this.prismaData.name}`);
    // TODO: We should also probably cleanup if client is in a camera or perhaps a VR place to avoid invalid states?
    const camera = client.currentCamera;
    if(camera){
      camera.removeClient(client);
    }
    const vrSpace = client.vrSpace;
    if(vrSpace){
      vrSpace.removeClient(client);
    }
    this.clients.delete(client.connectionId);
    client._setVenue(undefined);

    if(this._isEmpty){
      this.unload();
    }
    this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: false}, client.connectionId);
  }

  emitToAllClients: UserClient['venueEvents']['emit'] = (event, ...args) => {
    log.info(`emitting ${event} to all clients`);
    let allEmittersHadListeners = true;
    this.clients.forEach((client) => {
      log.debug('emitting to client: ', client.username);
      allEmittersHadListeners &&= client.venueEvents.emit(event, ...args);
    });
    if(!allEmittersHadListeners){
      log.warn(`at least one client didnt have any listener registered for the ${event} event type`);
    }
    return allEmittersHadListeners;
  };

  /**
   * Adds a senderClient to the venue. senderClients are distinct from normal clients in that
   * their only role is to send media to the server. The server can instruct connected senderClients to start or stop media producers.
   * The server is then responsible for linking the producers from senderCLients to the server Camera instances
   */
  addSenderClient (senderClient : SenderClient){
    log.info(`SenderClient ${senderClient.username} (${senderClient.connectionId}) added to the venue ${this.prismaData.name}`);
    // console.log('clients before add: ',this.clients);
    // const senderClient = new SenderClient(client);
    this.senderClients.set(senderClient.connectionId, senderClient);
    // console.log('clients after add: ',this.clients);
    senderClient._setVenue(this.venueId);
    this.emitToAllClients('senderAddedOrRemoved', {client: senderClient.getPublicState(), added: true}, senderClient.connectionId);
  }

  removeSenderClient (senderClient: SenderClient) {
    log.info(`SenderClient ${senderClient.username} (${senderClient.connectionId}) removed from the venue ${this.prismaData.name}`);
    this.senderClients.delete(senderClient.connectionId);
    senderClient._setVenue(undefined);

    if(this._isEmpty){
      this.unload();
    }
    this.emitToAllClients('senderAddedOrRemoved', {client: senderClient.getPublicState(), added: false}, senderClient.connectionId);
  }

  async createWebRtcTransport() {
    const transport = await this.router.createWebRtcTransport(mediasoupConfig.webRtcTransport);

    if(mediasoupConfig.maxIncomingBitrate){
      try{
        await transport.setMaxIncomingBitrate(mediasoupConfig.maxIncomingBitrate);
      } catch (e){
        log.error('failed to set maximum incoming bitrate');
      }
    }

    transport.on('dtlsstatechange', (dtlsState: soupTypes.DtlsState) => {
      if(dtlsState === 'closed'){
        log.info('---transport close--- transport with id ' + transport.id + ' closed');
        transport.close();
      }
    });

    // TODO: Why not work anymore????
    // transport.on('close', () => gatheringLog('---transport close--- transport with id ' + transport.id + ' closed'));

    return transport;
  }

  // Virtual space (lobby) stuff

  async CreateAndAddVirtualSpace() {
    this.prismaData.virtualSpace = await prisma.virtualSpace.create({
      include: {
        virtualSpace3DModel: true,
      },
      data: {
        virtualSpace3DModel: {
          create: {
            scale: 1,
            modelUrl: 'google.com',
            navmeshUrl: 'google.se'
          }
        },
        settings: {
          cool: 'asdfasdf',
        },
        venue: {
          connect: {venueId: this.prismaData.venueId},
        }
      }
    });
  }

  // Static stuff for global housekeeping
  private static venues: Map<VenueId, Venue> = new Map();

  static async createNewVenue(name: string, owner: UserId){
    try {
      const result = await prisma.venue.create({
        data: {
          name,
          owner: {
            connect: {
              userId: owner
            }
          },
          settings: {coolSetting: 'aaaww yeeeah'},
          startTime: new Date(),
          virtualSpace: {
            create: {
              virtualSpace3DModel: {
                create: {
                  scale: 1,
                  modelUrl: 'google.com',
                  navmeshUrl: 'google.se'
                }
              },
              settings: {
              }
            }
          }
        }
      });

      // prisma.virtualSpace.create({
      //   data: {
      //     virtualSpace3DModel: {
      //       create: {
      //         scale: 1,
      //         modelUrl: 'google.com',
      //         navmeshUrl: 'google.se'
      //       }
      //     },
      //     settings: {
      //       cool: 'asdfasdf',
      //     },
      //     venue: {
      //       connect: result,
      //     }
      //   }
      // });


      // const venue = await prisma.venue.findFirst({
      //   where: {
      //     name: 'Hello'
      //   }
      // });

      return result.venueId as VenueId;
    } catch (e){
      log.error(e);
      throw e;
    }
  }

  static async loadVenue(venueId: VenueId, ownerId: UserId, worker?: soupTypes.Worker) {
    try {
      if(Venue.venues.has(venueId)){
        throw new Error('Venue with that venueId already loaded');
      }
      const dbResponse = await prisma.venue.findUniqueOrThrow({
        where: {
          ownerId_venueId: {
            venueId,
            ownerId
          }
        },
        include: venueIncludeWhitelistVirtual,
      });

      if(!worker){
        worker = getMediasoupWorker();
      }
      const router = await worker.createRouter(mediasoupConfig.router);
      const venue = new Venue(dbResponse, router);
      log.info(`loading ${venue.prismaData.name} (${venue.prismaData.venueId})`);

      Venue.venues.set(venue.venueId, venue);
      return venue;
    } catch (e) {
      log.error('failed to load venue');
      throw e;
    }
  }


  static venueIsLoaded(params: {venueId: VenueId}){
    return Venue.venues.has(params.venueId);
  }

  static getLoadedVenues(){
    const obj: Record<VenueId, {venueId: VenueId, name: string}> = {};
    for(const [key, venue] of Venue.venues.entries()){
      obj[key] = {
        name: venue.prismaData.name,
        venueId: venue.venueId,
      };
    }
    return obj;
  }

  static getVenue(venueId: VenueId) {
    // if(venueId){
    const venue = Venue.venues.get(venueId);
    if(!venue){
      throw new Error('No venue with that id is loaded');
    }
    return venue;
    // }else if(params.name){
    //   throw Error('Please dont implement this. We should strive to use Ids throughout');
    //   // return this.getGatheringFromName(params.name);
    // } else {
    //   throw new Error('no id or name provided. Cant get venue! Duuuh!');
    // }
  }
}
