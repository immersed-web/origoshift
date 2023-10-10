import { Log } from 'debug-level';
const log = new Log('Venue');
process.env.DEBUG = 'Venue*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';

import {types as soupTypes} from 'mediasoup';
import { ConnectionId, UserId, VenueId, CameraId, VenueUpdate, SenderId, hasAtLeastSecurityLevel, VirtualSpace3DModelUpdate  } from 'schemas';

import { Prisma } from 'database';
import prisma, { cameraIncludeStuff } from '../modules/prismaClient';

import { Camera, VrSpace, type UserClient, SenderClient, BaseClient  } from './InternalClasses';
import { computed, shallowReactive } from '@vue/reactivity';
import { ProducerId } from 'schemas/mediasoup';
import { isPast } from 'date-fns';
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
  cameras: {
    include: cameraIncludeStuff
  },
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

  get visibility() { return this.prismaData.visibility; }

  // private _doorOpen = false;
  get doorsOpeningTime() { return this.prismaData.doorsOpeningTime; }
  get doorsAutoOpen() { return this.prismaData.doorsAutoOpen; }
  get doorsManuallyOpened() { return this.prismaData.doorsManuallyOpened; }
  get doorsAreOpen() {
    if(this.prismaData.doorsAutoOpen){
      return this.prismaData.doorsOpeningTime && isPast(this.prismaData.doorsOpeningTime);
    }
    else return this.doorsManuallyOpened;
  }

  get streamStartTime() { return this.prismaData.streamStartTime; }
  get streamAutoStart() { return this.prismaData.streamAutoStart; }
  get streamManuallyStarted() { return this.prismaData.streamManuallyStarted; }
  get streamManuallyEnded() { return this.prismaData.streamManuallyEnded; }
  get streamIsStarted() {
    if(this.prismaData.streamAutoStart){
      return this.prismaData.streamStartTime && isPast(this.prismaData.streamStartTime);
    }
    else return this.streamManuallyStarted;
  }
  get streamIsActive() {
    return this.streamIsStarted && !this.streamManuallyEnded;
  }

  // get allowGuests() { return this.prismaData.allowGuests; }
  // get publiclyListed() { return this.prismaData.publiclyListed; }

  // openDoors(){
  //   this._doorOpen = true;
  // }
  // closeDoors(){
  //   this._doorOpen = false;
  // }

  router: soupTypes.Router;
  vrSpace?: VrSpace;

  // cameras: Map<CameraId, Camera> = new Map();
  cameras = shallowReactive<Map<CameraId, Camera>>(new Map());

  private clients: Map<ConnectionId, UserClient> = new Map();
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  // senderClients: Map<ConnectionId, SenderClient> = new Map();
  private senderClients  = shallowReactive<Map<ConnectionId, SenderClient>>(new Map());
  senderClientIds = computed(() => {
    return Array.from(this.senderClients.keys());
  });
  //TODO: Find a way to use reactivity or memoization smoothly for backend instead of getters. We want to avoid unneccesary deep reactivity for performance
  get detachedSenders() {
    log.info('detachedSenders recalculated!');
    const senderArray = Array.from(this.senderClients.entries());
    const sendersWithoutCameraArray: typeof senderArray = senderArray.filter(([k, sender]) => !sender.camera);
    return new Map(sendersWithoutCameraArray);
    // TODO: Verify that my new version above works and that the old one below is unneccesary
    // const sendersInCamsConnectionIds = [] as ConnectionId[];
    // this.cameras.forEach(c => {
    //   if(c.sender) {
    //     sendersInCamsConnectionIds.push(c.sender.connectionId);
    //   }
    // });
    // const sendersConnectionIds = Array.from(this.senderClients.entries());
    // return new Map(sendersConnectionIds.filter(([sId, sender]) => !sendersInCamsConnectionIds.includes(sId)));
  }

  get _isEmpty() {
    return this.clients.size === 0 && this.senderClients.size === 0;
  }
  getPublicState() {
    const {venueId, name, visibility, doorsOpeningTime, doorsAutoOpen, doorsManuallyOpened, doorsAreOpen, streamStartTime, streamAutoStart, streamManuallyStarted, /*streamIsStarted*/ streamIsActive} = this;
    // log.info('Detached senders:', this.detachedSenders.value);
    // const cameraIds = Array.from(this.cameras.keys());
    const cameras: Record<CameraId, {
      cameraId: CameraId,
      name: string,
    }> = {};
    this.cameras.forEach((c) => {
      cameras[c.cameraId] = {
        cameraId: c.cameraId,
        name: c.name,
      };
    });
    return {
      venueId, name, visibility,
      doorsOpeningTime, doorsAutoOpen, doorsManuallyOpened, doorsAreOpen,
      streamStartTime, streamAutoStart, streamManuallyStarted, /*streamIsStarted*/ streamIsActive,
      vrSpace: this.vrSpace?.getPublicState(),
      cameras,
    };
  }

  getAdminOnlyState() {
    const { clientIds, owners } = this;
    const detachedSenders: Record<ConnectionId, {senderId: SenderId, connectionId: ConnectionId, username: string}> = {};
    this.detachedSenders.forEach(s => detachedSenders[s.connectionId] = {senderId: s.senderId, connectionId: s.connectionId, username: s.username});
    const cameras: Record<CameraId, ReturnType<Camera['getPublicState']>> = {};
    this.cameras.forEach(cam => cameras[cam.cameraId] = cam.getPublicState());

    // const publicState =  this.getPublicState();
    return { clientIds, owners ,detachedSenders, cameras };
  }

  //
  // NOTE: It's important we release all references here!
  unload() {
    log.info(`*****UNLOADING VENUE: ${this.name} (${this.venueId})`);
    this.emitToAllClients('venueWasUnloaded', this.venueId);
    this.router.close();
    // this.cameras.forEach(room => room.destroy());
    Venue.venues.delete(this.venueId);
    this.vrSpace?.unload();
  }

  async update (input: VenueUpdate) {
    log.info('Update venue', input);
    // if(input.name) { this.prismaData.name = input.name;}
    // if(input.doorsOpeningTime) { this.prismaData.doorsOpeningTime = input.doorsOpeningTime;}
    // if(input.streamStartTime) { this.prismaData.streamStartTime = input.streamStartTime;}
    this.prismaData = { ...this.prismaData, ...input};
    await prisma.venue.update({where: {venueId: this.prismaData.venueId}, data: input});
  }

  _notifyStateUpdated(reason?: string){
    const publicState = this.getPublicState();
    // const adminOnlyState = this.getAdminOnlyState();
    this.clients.forEach(c => {
      // if(
      //   hasAtLeastSecurityLevel(c.role, 'moderator')
      //   && -1 !== c.ownedVenues.findIndex((v) => v.venueId === this.venueId)
      // ){

      //   // c.notify.venueStateUpdatedAdminOnly?.({data: adminOnlyState, reason});
      // }else {
      //   c.notify.venueStateUpdated?.({data: publicState, reason});
      // }
      log.info(`notifying venuestate (${reason}) to client ${c.username} (${c.connectionId})`);
      c.notify.venueStateUpdated?.({data: publicState, reason});
    });
    this.senderClients.forEach(s => {
      log.info(`notifying venuestate (${reason}) to sender ${s.username} (${s.connectionId})`);
      if(!s.notify.venueStateUpdated){
        log.warn('sender didnt have subscriver attached');
        return;
      }
      s.notify.venueStateUpdated({data: publicState, reason});
    });
  }

  _notifyAdminOnlyState(reason?: string){
    const data = this.getAdminOnlyState();
    this.clients.forEach(c => {
      if(hasAtLeastSecurityLevel(c.role, 'moderator')){
        c.notify.venueStateUpdatedAdminOnly?.({data, reason});
      }
    });
  }

  // _notifySenderAddedOrRemoved(senderState: ReturnType<SenderClient['getPublicState']>, added: boolean, reason?: string){
  //   log.info('Notifying SenderAddedOrRemoved to clients!!!');
  //   log.info(this.clients.size);
  //   this.clients.forEach(c => {
  //     log.info(`notifying client ${c.username} (${c.connectionId}) (${c.clientType})`);
  //     if(!c.notify.senderAddedOrRemoved){
  //       log.warn('client didnt have observer attached');
  //       return;
  //     }
  //     c.notify.senderAddedOrRemoved({data: {senderState, added}, reason});
  //   });
  // }


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
    if(client.clientType === 'sender'){
      for(const v of this.senderClients.values()){
        if(v.senderId === client.senderId){
          throw Error('already joined with that senderId!');
        }
      }
      this.senderClients.set(client.connectionId, client);
      // this._notifyStateUpdated('sender added to venue');
      client._setVenue(this.venueId);
      this.tryMatchCamera(client);
      this._notifyAdminOnlyState('sender added to venue');
    }
    else {
      log.info('client wants to join');
      log.info('doors:', this.doorsManuallyOpened);
      if(!hasAtLeastSecurityLevel(client.role, 'moderator')){
        log.info('requsting client is below moderator');
        let doorsAreOpen = this.doorsManuallyOpened;
        if(this.doorsOpeningTime && isPast(this.doorsOpeningTime) ){
          doorsAreOpen = true;
        }
        if(!doorsAreOpen){
          throw Error('doors are not open');
        }
      }
      this.clients.set(client.connectionId, client);
      client._setVenue(this.venueId);
      this._notifyStateUpdated('Client added to Venue');
    }
    log.info(`Client (${client.clientType}) ${client.username} added to the venue ${this.prismaData.name}`);

    // this._notifyClients('venueStateUpdated', this.getPublicState(), 'because I wanna');
  }

  /**
   * Removes the client (client or sender) from the venue. Also automatically unloads the venue if it becomes empty
   * Also removes the client from camera or a vrSpace if its inside one
   */
  removeClient (client: UserClient | SenderClient) {
    log.info(`removing ${client.username} (${client.connectionId}) from the venue ${this.name}`);
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

      // TODO: Make sure this is not race condition where it throws because it cant find the camera instance
      // when using the camera getter
      // Should we perhaps remove the throw?
      log.info('TRYING TO READ CAMERA GETTER OF CLIENT:', client.username);
      client.camera?.setSender(undefined);
      this.senderClients.delete(client.connectionId);

      // this.emitToAllClients('senderAddedOrRemoved', {client: client.getPublicState(), added: false}, client.connectionId);
      // this._notifySenderAddedOrRemoved(client.getPublicState(), false, 'sender was removed');
      this._notifyAdminOnlyState('sender removed from venue');
    }
    client.onRemovedFromVenue();
    client._setVenue(undefined);

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
        // settings: {
        //   cool: 'asdfasdf',
        // },
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

  async Update3DModel (input: VirtualSpace3DModelUpdate) {
    log.info('Update 3D model', input);
    await prisma.virtualSpace3DModel.update({where: {modelId: input.modelId}, data: input});
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

      },
      include: cameraIncludeStuff
    });

    this.prismaData.cameras.push((result));

    return result.cameraId as CameraId;
  }

  async deleteCamera(cameraId: CameraId) {
    const prismaCamera = this.prismaData.cameras.find(c => c.cameraId === cameraId);
    if(!prismaCamera){
      throw Error('no camera with that cameraId in prismaData for the venue');
    }
    const foundCamera = this.cameras.get(cameraId);
    if(foundCamera){
      log.info('camera was loaded. Unloading before removal');
      // foundCamera._closeAllConsumers();
      foundCamera.unload();
      this.cameras.delete(cameraId);
    }

    const deleteResponse = await prisma.camera.delete({
      where: {
        cameraId
      }
    });
    const idx = this.prismaData.cameras.indexOf(prismaCamera);
    this.prismaData.cameras.splice(idx, 1);

    this._notifyStateUpdated('camera removed');
    this._notifyAdminOnlyState('camera removed');
    return deleteResponse;
  }

  /**
   * Utility function for closing all consumers of a producer
   * This function is primarily for situations where you cant have more fine grained control over consumers.
   * For example admin consuming from several cameras without joining them. Then we still want to be able to close consumption.
   * Try to avoid using this function if possible.
   */
  _closeAllConsumersOfProducer(producerId: ProducerId) {
    this.clients.forEach(client => {
      for (const testedProducerId of client.consumers.keys()) {
        if(testedProducerId === producerId){
          client.closeConsumer(testedProducerId, 'closing all consumers for that producer');
          break;
        }
      }
    });

  }

  private findSenderFromSenderId(senderId: SenderId) {
    for(const s of this.senderClients.values()){
      if(s.senderId === senderId){
        return s;
      }
    }
  }

  loadCamera(cameraId: CameraId) {
    if(this.cameras.has(cameraId)){
      throw Error('a camera with that id is already loaded');
    }
    const prismaCamera = this.prismaData.cameras.find(c => c.cameraId === cameraId);
    if(!prismaCamera){
      throw Error('no prisma data for a camera with that Id in venue prismaData');
    }
    let maybeSender: SenderClient | undefined = undefined;
    if(prismaCamera.senderId){
      maybeSender = this.findSenderFromSenderId(prismaCamera.senderId as SenderId);
    }
    const camera = new Camera(prismaCamera, this, maybeSender);
    this.cameras.set(camera.cameraId, camera);

    this._notifyStateUpdated('camera loaded');
    this._notifyAdminOnlyState('camera loaded');
  }

  tryMatchCamera(senderClient: SenderClient){
    log.info('TRYING TO FIND MATCHING CAMERA!');
    log.info('senderId:', senderClient.senderId);
    for(const [cKey, c] of this.cameras) {
      log.info('comparing against cameraId:', c.senderId);
      if(c.senderId === senderClient.senderId){
        log.info(`Found matched camera for sender ${senderClient.username} (${senderClient.senderId}). Attaching to it.`);
        c.setSender(senderClient);
        break;
      }
    }
  }

  async setSenderForCamera(senderId: SenderId, cameraId: CameraId){
    // const foundSender = this.senderClients.get(senderConnectionId);
    const foundSender = this.findSenderFromSenderId(senderId);
    if(!foundSender){
      throw Error('No sender with that connectionId in venue');
    }
    const foundCamera = this.cameras.get(cameraId);
    if(!foundCamera){
      throw Error('No camera with that cameraId in venue');
    }
    await foundCamera.setSender(foundSender);
    this._notifyAdminOnlyState('attached new sender to a camera');
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
          // settings: {coolSetting: 'aaaww yeeeah'},
          // startTime: new Date(),
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

  // static async clientRequestLoadVenue()
  static async loadVenue(venueId: VenueId, ownerId: UserId, worker?: soupTypes.Worker) {
    try {
      const loadedVenue = Venue.venues.get(venueId);
      if(loadedVenue){
        log.warn('Venue with that venueId already loaded');
        return loadedVenue;
        // throw new Error('Venue with that venueId already loaded');
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
        // throw Error('you are not owner of the venue! Not allowed!');
        if(dbResponse.doorsOpeningTime && !isPast(dbResponse.doorsOpeningTime?.getTime())){
          throw Error('You are not owner of the venue AND the doors opening time has not passed / is not set.');
        }
      }

      if(!worker){
        worker = getMediasoupWorker();
      }
      const router = await worker.createRouter(mediasoupConfig.router);
      const venue = new Venue(dbResponse, router);
      log.info(`*****LOADING VENUE: ${venue.name} (${venue.venueId})`);
      log.info('venueIncludeStuff: ', venueIncludeStuff);
      log.info('venue was loaded with db data:', dbResponse);

      Venue.venues.set(venue.venueId, venue);
      return venue;
    } catch (e) {
      log.error('failed to load venue');
      log.error(e);
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

  static getLoadedVenuesPublicState(){
    // TODO: set correct type for state field
    const obj: Record<VenueId, {venueId: VenueId, state: ReturnType<Venue['getPublicState']>}> = {};
    for(const [key, venue] of Venue.venues.entries()){
      obj[key] = {
        venueId: venue.venueId,
        state: venue.getPublicState()
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

  static async getPublicVenue(venueId: VenueId, userId: UserId) {
    // if(venueId){
    const venue = Venue.venues.get(venueId);
    if(!venue){
      throw new Error('No venue with that id is loaded');
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
    if(!dbResponse.owners.find(u => u.userId === userId)){
      if(venue.visibility === 'private' ){
        throw Error('Either this event does not exist or you are not allowed to access it.');
      }
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
