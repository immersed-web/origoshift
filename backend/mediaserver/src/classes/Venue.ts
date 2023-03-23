import { Log } from 'debug-level';
const log = new Log('Venue');
process.env.DEBUG = 'Venue*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';

import {types as soupTypes} from 'mediasoup';
import { ConnectionId, UserId, VenueId, CameraId, VenueUpdate, SenderId  } from 'schemas';

import { Prisma } from 'database';
import prisma from '../modules/prismaClient';

import { Camera, VrSpace, type UserClient, SenderClient, BaseClient  } from './InternalClasses';
// import { NotifierInputData } from 'trpc/trpc-utils';

const basicUserSelect = {
  select: {
    userId: true,
    username: true,
    role: true,
  }
} satisfies Prisma.Venue$ownersArgs;

const venueIncludeStuff  = {
  whitelistedUsers: basicUserSelect,
  blackListedUsers: basicUserSelect,
  owners: basicUserSelect,
  virtualSpace: {include: {virtualSpace3DModel: true}},
  cameras: true,
} satisfies Prisma.VenueInclude;
const args = {include: venueIncludeStuff} satisfies Prisma.VenueArgs;
type VenueResponse = Prisma.VenueGetPayload<typeof args>

// type NotifyKey = keyof UserClient['notify'];
// type NotifyInput<K extends NotifyKey> = NotifierInputData<UserClient['notify'][K]>
export class Venue {
  private constructor(prismaData: VenueResponse, router: soupTypes.Router){
    this.router = router;
    this.prismaData = prismaData;
    if(prismaData.virtualSpace){
      this.vrSpace = new VrSpace(this, prismaData.virtualSpace);
    }
    prismaData.cameras.forEach(c => {
      this.loadCamera(c.cameraId as CameraId);
    });

    // this.owners.forEach(o => {
    //   o.
    // })
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

  get owners()  {
    return this.prismaData.owners.reduce<Record<UserId, typeof this.prismaData.owners[number]>>((prev, cur) => {
      prev[cur.userId as UserId] = cur;
      return prev;
    }, {});
  }


  router: soupTypes.Router;
  vrSpace?: VrSpace;

  cameras: Map<CameraId, Camera> = new Map();

  private clients: Map<ConnectionId, UserClient> = new Map();
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  senderClients: Map<ConnectionId, SenderClient> = new Map();
  // get senderClientIds() {
  //   return Array.from(this.senderClients.keys());
  // }

  get _isEmpty() {
    return this.clients.size === 0 && this.senderClients.size === 0;
  }
  getPublicState() {
    const {venueId, name, clientIds, owners} = this;
    const cameras: Record<CameraId, ReturnType<Camera['getPublicState']>> = {};
    this.cameras.forEach(cam => cameras[cam.cameraId] = cam.getPublicState());
    const senders: Record<ConnectionId, ReturnType<SenderClient['getPublicState']>> = {};
    this.senderClients.forEach(s => senders[s.connectionId] = s.getPublicState());
    return {
      venueId, name, clientIds, owners,
      vrSpace: this.vrSpace?.getPublicState(),
      senders,
      cameras
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

  _notifyStateUpdated(reason?: string){
    const data = this.getPublicState();
    this.clients.forEach(c => c.notify.venueStateUpdated?.({data, reason}));
  }

  _notifySenderAddedOrRemoved(senderState: ReturnType<SenderClient['getPublicState']>, added: boolean, reason?: string){
    log.info('Notifying SenderAdded to clients!!!');
    log.info(this.clients.size);
    this.clients.forEach(c => {
      log.info(`notifying client ${c.username} (${c.connectionId}) (${c.clientType})`);
      if(!c.notify.senderAddedOrRemoved){
        log.warn('client didnt have observer attached');
        return;
      }
      c.notify.senderAddedOrRemoved({data: {senderState, added}, reason});
    });
  }


  // _notifyClients<K extends NotifyKey, Input extends NotifyInput<K>['data']>(key: K extends NotifyKey ? K : never, data: Input, reason?: string){
  //   // const data = this.getPublicState();
  //   this.clients.forEach(c => {
  //     const notifyFunction = c.notify[key];
  //     if(notifyFunction){
  //       notifyFunction({});
  //     }
  //   });
  // }

  /**
   * adds a client (client or sender) to this venues collection of clients. Also takes care of assigning the venue inside the client itself
   * @param client the client instance to add to the venue
   */
  addClient ( client : UserClient | SenderClient){
    // TODO: We should probably decide on where and when we trigger different notifiers. As of now we do both stateupdate and senderaddedremoved
    if(client.clientType === 'sender'){
      this.senderClients.set(client.connectionId, client);
      this._notifySenderAddedOrRemoved(client.getPublicState(), true, 'sender was added');
      // this.emitToAllClients('senderAddedOrRemoved', {client: client.getPublicState(), added: true}, client.connectionId);
    }
    else {
      this.clients.set(client.connectionId, client);
      this._notifyStateUpdated('Client added to Venue');
    //   this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: true}, client.connectionId);
    }
    client._setVenue(this.venueId);
    log.info(`Client (${client.clientType}) ${client.username} added to the venue ${this.prismaData.name}`);

    // this._notifyClients('venueStateUpdated', this.getPublicState(), 'because I wanna');
  }

  /**
   * Removes the client (client or sender) from the venue. Also automatically unloads the venue if it becomes empty
   * Also removes the client from camera or a vrSpace if its inside one
   */
  removeClient (client: UserClient | SenderClient) {
    log.info(`removing ${client.username} (${client.connectionId}) from the venue ${this.name}`);
    client._setVenue(undefined);
    if(client.clientType === 'client'){
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
      // this.emitToAllClients('clientAddedOrRemoved', {client: client.getPublicState(), added: false}, client.connectionId);
      this._notifyStateUpdated('client removed from venue');
    } else {
      this.senderClients.delete(client.connectionId);
      // this.emitToAllClients('senderAddedOrRemoved', {client: client.getPublicState(), added: false}, client.connectionId);
      this._notifySenderAddedOrRemoved(client.getPublicState(), false, 'sender was removed');
    }

    // If this was the last client in the venue, lets unload it!
    if(this._isEmpty){
      this.unload();
    }
  }

  emitToAllClients: BaseClient['clientEvent']['emit'] = (event, ...args) => {
    log.info(`emitting ${event} to all clients`);
    let allEmittersHadListeners = true;
    this.clients.forEach((client) => {
      log.debug('emitting to client: ', client.username);
      allEmittersHadListeners &&= client.clientEvent.emit(event, ...args);
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
  // addSenderClient (senderClient : SenderClient){
  //   log.info(`SenderClient ${senderClient.username} (${senderClient.connectionId}) added to the venue ${this.prismaData.name}`);
  //   // console.log('clients before add: ',this.clients);
  //   // const senderClient = new SenderClient(client);
  //   this.senderClients.set(senderClient.connectionId, senderClient);
  //   // console.log('clients after add: ',this.clients);
  //   senderClient._setVenue(this.venueId);
  //   this.emitToAllClients('senderAddedOrRemoved', {client: senderClient.getPublicState(), added: true}, senderClient.connectionId);
  // }

  // removeSenderClient (senderClient: SenderClient) {
  //   log.info(`SenderClient ${senderClient.username} (${senderClient.connectionId}) removed from the venue ${this.prismaData.name}`);
  //   this.senderClients.delete(senderClient.connectionId);
  //   senderClient._setVenue(undefined);

  //   if(this._isEmpty){
  //     this.unload();
  //   }
  //   this.emitToAllClients('senderAddedOrRemoved', {client: senderClient.getPublicState(), added: false}, senderClient.connectionId);
  // }

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

        // virtualSpace3DModel:  {

        //   // create: {
        //   //   scale: 1,
        //   //   modelUrl: 'google.com',
        //   //   navmeshUrl: 'google.se'
        //   // }
        // },
        settings: {
          cool: 'asdfasdf',
        },
        venue: {
          connect: {venueId: this.prismaData.venueId},
        }
      }
    });
    this.vrSpace = new VrSpace(this, this.prismaData.virtualSpace);
    this._notifyStateUpdated('Created virtual space');
  }

  async Create3DModel(modelUrl: string) {
    if(this.prismaData.virtualSpace){
      this.prismaData.virtualSpace.virtualSpace3DModel = await prisma.virtualSpace3DModel.create({
        data: {
          modelUrl: modelUrl,
          navmeshUrl: '',
          public: false,
          scale: 1,
          virtualSpaces: {
            connect: {vrId: this.prismaData.virtualSpace.vrId}
          }
        },
      });
      this._notifyStateUpdated('Created 3d model');
    }
  }

  async UpdateNavmesh (modelUrl: string) {
    if(this.prismaData.virtualSpace?.virtualSpace3DModel){
      this.prismaData.virtualSpace.virtualSpace3DModel.navmeshUrl = modelUrl;
      await prisma.virtualSpace3DModel.update({where: {modelId: this.prismaData.virtualSpace.virtualSpace3DModel.modelId}, data: {navmeshUrl: modelUrl}});
      this._notifyStateUpdated('Updated navmesh');
    }
  }

  async Remove3DModel(modelId: string) {
    if(this.prismaData.virtualSpace && this.prismaData.virtualSpace.virtualSpace3DModel){
      this.prismaData.virtualSpace.virtualSpace3DModel = await prisma.virtualSpace3DModel.delete(
        {
          where: {modelId}
        }
      );
      this._notifyStateUpdated('Removed 3d model');
    }
  }

  async createNewCamera(name: string, senderId?: SenderId){
    const result = await prisma.camera.create({
      data: {
        name,
        venue: {
          connect: {
            venueId: this.venueId
          }
        },
        senderId,
        settings: {coolSetting: 'aaaww yeeeah'},
        // startTime: new Date(),
        // virtualSpace: {
        //   create: {
        //     settings: 'asdas'
        //   }
        // }

      }
    });

    this.prismaData.cameras.push((result));

    return result.cameraId as CameraId;
  }

  loadCamera(cameraId: CameraId, sender?: SenderClient) {
    if(this.cameras.has(cameraId)){
      throw Error('a camera with that id is already loaded');
    }
    const prismaCamera = this.prismaData.cameras.find(c => c.cameraId === cameraId);
    if(!prismaCamera){
      throw Error('no prisma data for a camera with that Id in venue prismaData');
    }
    // Try to auto connect to sender from senderId
    if(!sender && prismaCamera.senderId){
      for(const s of this.senderClients.values()){
        if(s.senderId === prismaCamera.senderId){
          sender = s;
        }
      }
    }
    const camera = new Camera(prismaCamera, this, sender);
    this.cameras.set(camera.cameraId, camera);

    this._notifyStateUpdated('camera loaded');
  }

  // Static stuff for global housekeeping
  private static venues: Map<VenueId, Venue> = new Map();

  static async createNewVenue(name: string, owner: UserId){
    try {

      const result = await prisma.venue.create({
        data: {
          name,
          owners: {
            connect: {
              userId: owner
            }
          },
          settings: {coolSetting: 'aaaww yeeeah'},
          startTime: new Date(),
        }
      });

      return result.venueId as VenueId;
    } catch(e) {
      log.error(e);
      throw e;
    }
  }

  static async deleteVenue(venueId: VenueId) {
    const deletedVenue = await prisma.venue.delete({
      where: {
        venueId
      }
    });
    return deletedVenue;
  }

  static async loadVenue(venueId: VenueId, ownerId: UserId, worker?: soupTypes.Worker) {
    try {
      if(Venue.venues.has(venueId)){
        throw new Error('Venue with that venueId already loaded');
      }
      const dbResponse = await prisma.venue.findUniqueOrThrow({
        where: {
          venueId,
          // ownerId_venueId: {
          //   venueId,
          //   ownerId
          // }
        },
        include: venueIncludeStuff,
      });
      if(!dbResponse.owners.find(u => u.userId === ownerId)){
        throw Error('you are not owner of the venue! Not allowed!');
      }

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
