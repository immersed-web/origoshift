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

import Client  from './Client';
import VrSpace from './VRSpace';
import Camera from './Camera';
// import { FilteredEvents } from 'trpc/trpc-utils';

const venueIncludeWhitelistVirtual  = {
  whitelistedUsers: {
    select: {
      userId: true
    }
  },
  virtualSpace: true,
} satisfies Prisma.VenueInclude;
const args = {include: venueIncludeWhitelistVirtual} satisfies Prisma.VenueArgs;
type VenueResponse = Prisma.VenueGetPayload<typeof args>

export default class Venue {
  // First some static stuff for global housekeeping
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
              settings: 'asdas'
            }
          }

        }
      });

      return result.venueId;
    } catch (e){
      log.error(e);
      throw e;
    }
  }
  static async loadVenue(venueId: VenueId, worker?: soupTypes.Worker) {
    try {
      if(Venue.venues.has(venueId)){
        throw new Error('Venue already loaded');
      }
      const dbResponse = await prisma.venue.findUniqueOrThrow({
        where: {
          venueId
        },
        include: venueIncludeWhitelistVirtual,
      });

      if(!worker){
        worker = getMediasoupWorker();
      }
      const router = await worker.createRouter(mediasoupConfig.router);
      const venue = new Venue(dbResponse, router);
      log.info(`loading ${venue.prismaData.name} (${venue.prismaData.venueId})`);
      return venue;
    } catch (e) {
      log.error('failed to load venue');
      throw e;
    }
  }

  // NOTE: It's important we release all references here!
  unload() {
    log.info(`unloading ${this.prismaData.name} (${this.venueId})`);
    this.emitToAllClients('venueWasUnloaded', this.venueId);
    this.router.close();
    // this.cameras.forEach(room => room.destroy());
    Venue.venues.delete(this.venueId);
    this.vrSpace.unload();
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

  private prismaData: VenueResponse;

  get venueId() {
    return this.prismaData.venueId as VenueId;
  }
  get name() { return this.prismaData.name; }
  get ownerId() {
    return this.prismaData.ownerId as UserId;
  }

  router: soupTypes.Router;
  vrSpace: VrSpace;

  cameras: Map<CameraId, Camera> = new Map();

  private clients: Map<ConnectionId, Client> = new Map();
  get clientList() {
    return Array.from(this.clients.keys());
  }

  private constructor(prismaData: VenueResponse, router: soupTypes.Router){
    this.router = router;
    this.prismaData = prismaData;

    this.vrSpace = new VrSpace(this, prismaData.virtualSpace);

    const venueAlreadyLoaded = Venue.venues.has(this.venueId);
    if(venueAlreadyLoaded){
      throw new Error('Venue with that venueId already loaded');
    }

    Venue.venues.set(this.venueId, this);
  }

  /**
   * adds a client to this venues collection of clients. Also takes care of assigning the venue inside the client itself
   * @param client the client instance to add to the venue
   */
  addClient ( client : Client){
    log.info(`Client ${client.username} added to the venue ${this.prismaData.name}`);
    // console.log('clients before add: ',this.clients);
    this.clients.set(client.connectionId, client);
    // console.log('clients after add: ',this.clients);
    client._setVenue(this.venueId);
    this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: true}, client.connectionId);
  }

  /**
   * Removes the client from the venue. Also automatically unloads the venue if it becomes empty
   */
  removeClient (client: Client) {
    log.info(`removing ${client.username} from the venue ${this.prismaData.name}`);
    // TODO: We should also probably cleanup if client is in a camera or perhaps a VR place to avoid invalid states
    this.clients.delete(client.connectionId);
    client._setVenue(undefined);

    if(!this.clients.size){
      this.unload();
    }
    this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: false}, client.connectionId);
  }

  emitToAllClients: Client['venueEvents']['emit'] = (event, ...args) => {
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

  // Hpefully well never have to uncomment and use this function. for security we aim to not expose the raw clients outside the venue instance
  // getClient (connectionId: ConnectionId){
  //   const client = this.clients.get(connectionId);
  //   if(!client){
  //     throw new Error('no client with that id in venue');
  //   }
  //   return client;
  // }

  // addSender(client: Client){
  //   this.senderClients.set(client.id, client);
  //   this.broadCastGatheringState();
  // }

  // removeSender(client: Client){
  //   this.senderClients.delete(client.id);
  //   this.broadCastGatheringState();
  // }

  // getSender (clientId: string){
  //   const client = this.senderClients.get(clientId);
  //   if(!client){
  //     throw new Error('no client with that id in gathering');
  //   }
  //   return client;
  // }








  // getRtpCapabilities(): soupTypes.RtpCapabilities {
  //   return this.router.rtpCapabilities;
  // }

  // createRoom({roomId, roomName}: {roomId?: string, roomName: string}){
  //   if(roomId){
  //     this.rooms.forEach(room => {
  //       if(room.id === roomId){
  //         throw new Error('NO CAN DO!! A room with that ID already exists in the gathering.');
  //       }
  //     });
  //   }
  //   if(roomName){
  //     this.rooms.forEach(room => {
  //       if(room.roomName === roomName){
  //         throw new Error('NO CAN DO!! A room with that name already exists in the gathering.');
  //       }
  //     });
  //   }
  //   const room = Room.createRoom({roomId, roomName, gathering: this});
  //   this.rooms.set(room.id, room);
  //   this.broadCastGatheringState(undefined, 'room created');

  //   return room;
  // }

  // sendGatheringStateTo(client: Client, updateReason?: string){
  //   const state = this.gatheringState;
  //   let reason = 'update reason not specified';
  //   if(updateReason) reason = updateReason;
  //   const msg = createMessage('gatheringStateUpdated',{newState: state, reason });
  //   client.send(msg);
  // }

  // // TODO: We should throttle some or perhaps all of the broadcast functions so we protect from overload
  // broadCastGatheringState(clientsToSkip: string[] = [], updateReason?: string) {
  //   Log(`gonna broadcast to ${this.clients.size} clients`);
  //   let reason = 'update reason not specified';
  //   if(updateReason) reason = updateReason;

  //   this.clients.forEach(client => {
  //     if(client.connectionId in clientsToSkip){
  //       Log('skipping client:', client.connectionId);
  //       return;
  //     }
  //     const gatheringStateMsg = createMessage('gatheringStateUpdated', {newState: this.gatheringState, reason});
  //     Log(`sending gatheringStateUpdated to client ${client.connectionId}`);
  //     client.send(gatheringStateMsg);
  //   });
  // }

  // deleteRoom(roomOrId: Room | string){
  //   if(typeof roomOrId === 'string'){
  //     this.rooms.delete(roomOrId);
  //     return;
  //   }
  //   this.rooms.delete(roomOrId.id);
  //   this.broadCastGatheringState(undefined, 'room deleted');
  // }

  // get gatheringState() {
  //   // const gatheringState: GatheringState = { gatheringId: this.id, rooms: {}, senderClients: {}, clients: {} };
  //   const gatheringState: GatheringState = { gatheringId: this.uuid, rooms: {}, clients: {} };
  //   if(this.name){
  //     gatheringState.gatheringName = this.name;
  //   }
  //   this.rooms.forEach((room) => {
  //     const roomstate = room.shallowRoomState;
  //     gatheringState.rooms[room.id] = roomstate;
  //   });
  //   // this.senderClients.forEach(senderClient => {
  //   //   gatheringState.senderClients[senderClient.id] = senderClient.clientState;
  //   // });
  //   this.clients.forEach(client => {
  //     gatheringState.clients[client.connectionId] = client.clientState;
  //   });
  //   return gatheringState;
  // }

  // getRoom({id, name}: {id?: string, name?: string}) {
  //   let foundRoom: Room | undefined;
  //   if(id){
  //     foundRoom = this.rooms.get(id);
  //   }
  //   if(name){
  //     for (const [ _ , room] of this.rooms) {
  //       if(room.roomName === name){
  //         foundRoom = room;
  //       }
  //     }
  //   }
  //   if(!foundRoom){
  //     throw new Error('the gathering doesnt have a room with that id or name');
  //   }
  //   return foundRoom;
  // }

  async createWebRtcTransport() {
    const transport = await this.router.createWebRtcTransport(mediasoupConfig.webRtcTransport);

    // const { listenIps, enableUdp, enableTcp, preferUdp, initialAvailableOutgoingBitrate } = mediasoupConfig.webRtcTransport;
    // const transport = await this.router.createWebRtcTransport({
    //   listenIps,
    //   enableUdp,
    //   preferUdp,
    //   enableTcp,
    //   initialAvailableOutgoingBitrate,
    // });

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
}
