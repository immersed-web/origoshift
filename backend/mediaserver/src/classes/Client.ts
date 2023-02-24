import { randomUUID } from 'crypto';
import type {types as soupTypes} from 'mediasoup';
import { TypedEmitter } from 'tiny-typed-emitter';
import { Log } from 'debug-level';

const log = new Log('Client');

process.env.DEBUG = 'Client*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransform, ClientTransforms, ConnectionId, ConnectionIdSchema, JwtUserData, UserId, UserRole, VenueId, CameraId } from 'schemas';
import { getVenue, Venue } from './InternalClasses';
import { FilteredEvents, NonFilteredEvents } from 'trpc/trpc-utils';
import { ConsumerId, ProducerId, TransportId } from 'schemas/mediasoup';


export type ClientEvents = NonFilteredEvents<{
  'clientState': (clientState: PublicClientState) => void
}>

export type ClientVenueEvents = FilteredEvents<{
  'clientAddedOrRemoved': (data: {client: ReturnType<Client['getPublicState']>, added: boolean}) => void,
}, ConnectionId>
& NonFilteredEvents<{
  'venueWasUnloaded': (venueId: VenueId) => void,
}>

export type ClientVrEvents = NonFilteredEvents<{
  'clientTransforms': (transforms: ClientTransforms) => void
}>

export type ClientSoupEvents = NonFilteredEvents<{
  // 'onProducer': ()
  'transportClosed': (transportId: TransportId) => void
  'consumerPausedOrResumed': (data: {consumerId: ConsumerId, wasPaused: boolean}) => void
  'producerPausedOrResumed': (data: {producerId: ProducerId, wasPaused: boolean}) => void
  'consumerClosed': (consumerId: ConsumerId) => void
  'producerClosed': (producerId: ProducerId) => void
}>

export type PublicClientState = {
  connectionId: ConnectionId,
  userId: UserId,
  userName: string,
  transform?: ClientTransform,
  role: UserRole,
  currentVenueId?: VenueId,
}
interface ConstructorParams {
  connectionId?: ConnectionId,
  // ws: SocketWrapper,
  jwtUserData: JwtUserData,
}
/**
 * @class
 * This class represents the backend state of a client connection.
 */
export class Client {
  /**
  * The id of the actual connection. This differs from the userId, as a user could potentially have multiple concurrent active connections
  */
  connectionId: ConnectionId;

  jwtUserData: JwtUserData;
  /**
   * The user's id. Be aware that this doesn't uniquely identify the active connection/session, as the user could run multiple concurrent connections.
   * Instead, use "connectionId" for that.
   */
  get userId(): UserId {
    return this.jwtUserData.userId;
  }
  get username(): string{
    return this.jwtUserData.username;
  }
  get role (): UserRole {
    return this.jwtUserData.role;
  }

  private currentCameraId?: CameraId;
  /**
   * **WARNING**: You should never need to call this function, since the camera instance calls this for you when it adds a client to itself.
   */
  _setCamera(cameraId?: CameraId){
    this.currentCameraId = cameraId;
  }
  get currentCamera() {
    if(!this.currentCameraId) return undefined;
    if(!this.venue){
      throw Error('Something is really off! currentCameraId is set but client isnt in a venue! Invalid state!');
    }
    const camera = this.venue.cameras.get(this.currentCameraId);
    if(!camera){
      throw Error('client had an assigned currentCameraId but that camera was not found in venue. Invalid state!');
    }
    return camera;
  }

  private _socketClosed = false;

  transform: ClientTransform | undefined;

  rtpCapabilities?: soupTypes.RtpCapabilities;
  receiveTransport?: soupTypes.WebRtcTransport;
  sendTransport?: soupTypes.WebRtcTransport;
  consumers: Map<ConsumerId, soupTypes.Consumer> = new Map();
  producers: Map<ProducerId, soupTypes.Producer> = new Map();

  clientEvents: TypedEmitter<ClientEvents>;
  venueEvents: TypedEmitter<ClientVenueEvents>;
  vrEvents: TypedEmitter<ClientVrEvents>;
  soupEvents: TypedEmitter<ClientSoupEvents>;

  isInVrSpace = false;
  get vrSpace(){
    if(this.isInVrSpace){
      try{
        if(!this.venueId){
          // log.error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
          throw Error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
        }
        return this.venue?.vrSpace;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
  }
  private venueId?: VenueId;
  /**
   * **WARNING**: You should never need to call this function, since the venue instance calls this for you when it adds a client to itself.
   */
  _setVenue(venueId: VenueId | undefined){
    this.venueId = venueId;
    // this.getVenue()?.createWebRtcTransport();
  }
  get venue() {
    try{
      if(!this.venueId) return undefined;
      return getVenue(this.venueId);
      // return Venue.getVenue(this.venueId);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  constructor({connectionId = ConnectionIdSchema.parse(randomUUID()), jwtUserData}: ConstructorParams){
    log.info('Creating Client with connectionId: ', connectionId);
    this.connectionId = ConnectionIdSchema.parse(connectionId);
    this.jwtUserData = jwtUserData;

    this.clientEvents = new TypedEmitter();
    this.venueEvents = new TypedEmitter();
    this.vrEvents = new TypedEmitter();
    this.soupEvents = new TypedEmitter();

    // this.vrEvents.on('clientTransforms', ()=> log.info(`${this.username} received a clientTransform`));

    // this.venueEvents.on('clientAddedOrRemoved', (data, filter) => console.log('client emitter triggered. data:',data, 'filter:', filter));
  }

  // NOTE: It's important we release all references here!
  unload() {
    log.info(`unloading client ${ this.username } ${this.connectionId} `);
    this._socketClosed = true;
    this.consumers.forEach(c => c.close());
    this.producers.forEach(p => p.close());
    this.sendTransport?.close();
    this.receiveTransport?.close();
    this.leaveCurrentVenue();
  }

  getPublicState(): PublicClientState{
    return {
      connectionId: this.connectionId,
      userId: this.userId,
      userName: this.username,
      role: this.role,
      currentVenueId: this.venue?.venueId,
      transform: this.transform,
    };
  }

  _notifyClientStateUpdated() {
    if(this._socketClosed){
      log.info('skipped emitting to client because socket was already closed');
      return;
    }
    log.info(`emitting clientState for ${this.username} (${this.userId})`);
    this.clientEvents.emit('clientState', this.getPublicState());
  }


  async joinVenue(venueId: VenueId) {
    this.leaveCurrentVenue();
    const venue = Venue.getVenue(venueId);
    venue.addClient(this);
    this.sendTransport = await venue.createWebRtcTransport();
    this.receiveTransport = await venue.createWebRtcTransport();
    this._notifyClientStateUpdated();
  }

  /**
   * @returns boolean indicating if the client was in a venue in the first place. So calling this function when not in a venue will simply do nothing and return false.
   */
  leaveCurrentVenue() {
    if(!this.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    this.closeAllProducers();
    this.closeAllConsumers();
    this.closeAllTransports();
    this.venue.vrSpace.removeClient(this);
    // this.camera.removeClient(this);
    this.venue.removeClient(this);
    this._notifyClientStateUpdated();
    return true;
  }

  joinVrSpace(){
    this.leaveCurrentCamera();
    if(!this.venue){
      throw Error('cant join vrspace if isnt in a venue!');
    }
    this.venue.vrSpace.addClient(this);
    this._notifyClientStateUpdated();
  }
  leaveVrSpace() {
    this.venue?.vrSpace.removeClient(this);
    this._notifyClientStateUpdated();
  }

  joinCamera(cameraId: CameraId) {
    const camera = this.venue?.cameras.get(cameraId);
    if(!camera){
      throw Error('no camera with that id exist in the venue');
    }
    camera.addClient(this);
    this._notifyClientStateUpdated();
  }
  /**
   * @returns boolean indicating if the client was in a camera in the first place. Calling this function when not in a camera will simply do nothing and return false.
   */
  leaveCurrentCamera() {
    if(!this.currentCamera){
      return false;
    }
    this.currentCamera.removeClient(this);
    this._notifyClientStateUpdated();
  }

  closeAllTransports() {
    if(this.sendTransport){
      this.sendTransport.close();
      this.soupEvents.emit('transportClosed', this.sendTransport.id as TransportId);
      this.sendTransport = undefined;
    }
    if(this.receiveTransport){
      this.receiveTransport.close();
      this.soupEvents.emit('transportClosed', this.receiveTransport.id as TransportId);
      this.receiveTransport = undefined;
    }
  }

  closeAllProducers = () => {
    const producerArray = Array.from(this.producers.entries());
    for(const [producerKey, producer] of producerArray){
      producer.close();
      this.soupEvents.emit('producerClosed', producer.id as ProducerId);
      // const closeProducersMsg = createMessage('notifyCloseEvent', {
      //   objectType: 'producer',
      //   objectId: producerKey,
      // });
      // this.send(closeProducersMsg);
      this.producers.delete(producerKey);
    }
    // this.room?.broadcastRoomState('a client closed all their producers');
  };

  closeAllConsumers = () => {
    const consumerArray = Array.from(this.consumers.entries());
    for(const [consumerKey, consumer] of consumerArray){
      consumer.close();
      this.soupEvents.emit('consumerClosed', consumer.id as ConsumerId);
      // const closeConsumerMsg = createMessage('notifyCloseEvent', {
      //   objectType: 'consumer',
      //   objectId: consumerKey,
      // });
      // this.send(closeConsumerMsg);
      this.consumers.delete(consumerKey);
    }
  };

  // private roomId?: string;
  // setRoom(roomId: string | undefined){
  //   this.roomId = roomId;
  // }
  // get room() {
  //   try {
  //     if(!this.roomId) return undefined;
  //     return this.gathering?.getRoom({ id: this.roomId });
  //   } catch(e) {
  //     console.error(e);
  //     return undefined;
  //   }
  // }


  // private handleReceivedMsg = async (msg: SocketMessage<UnknownMessageType>) => {
  //   if(msg.type === 'response'){
  //     console.error('message handler called with response message. That should not happen!!', msg);
  //     return;
  //   }
  //   if(msg.type === 'message'){
  //     //TODO: Handle the message type
  //     console.log('received normal message (not request)');
  //     console.warn('No message handlers implemented!!!');
  //     return;
  //   }
  //   if(!msg.id){
  //     console.error('no id in received request!!!');
  //     return;
  //   }
  //   //check authorization
  //   if(!checkPermission(this.jwtUserData.role, msg.subject)){
  //     const response = createResponse(msg.subject, msg.id, {
  //       wasSuccess: false,
  //       message: 'NOT AUTHORIZED!!!! Get outta here!!'
  //     });
  //     this.send(response);
  //     return;
  //   }
  //   // console.log('received Request!!');
  //   switch (msg.subject) {
  //     case 'setName': {
  //       this.send(createResponse('setName', msg.id, {
  //         wasSuccess: false,
  //         message: 'NOT IMPLEMENTED YET!!! GO AWAAAY!',
  //       }));
  //       // this.nickName = msg.data.name;
  //       // const response = createResponse('setName', msg.id, {
  //       //   wasSuccess: true,
  //       // });
  //       // this.send(response);
  //       break;
  //     }
  //     case 'getClientState': {
  //       let response: ResponseTo<'getClientState'>;
  //       try{
  //         response = createResponse('getClientState', msg.id, { wasSuccess: true, data: this.clientState});
  //       } catch( e){
  //         response = createResponse('getClientState', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to get clientState'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'setRtpCapabilities': {
  //       this.rtpCapabilities = msg.data;
  //       const response = createResponse('setRtpCapabilities', msg.id, {
  //         wasSuccess: true
  //       });
  //       this.send(response);
  //       break;
  //     }
  //     case 'getRouterRtpCapabilities': {
  //       // const response = {
  //       //   type: 'dataResponse',
  //       //   subject: 'getRouterRtpCapabilities',
  //       //   isResponse: true,
  //       // } as UnfinishedResponse<GetRouterRtpCapabilitiesResponse>;
  //       if(!this.gathering){
  //         console.warn('Client requested router capabilities without being in a gathering');
  //         const response = createResponse('getRouterRtpCapabilities', msg.id, {
  //           wasSuccess: false,
  //           message: 'not in a gathering. Must be in gathering to request RtpCapabilities',
  //         });
  //         this.send(response);
  //         return;
  //       }
  //       const roomRtpCaps = this.gathering.getRtpCapabilities();
  //       // console.log('client want routerRtpCaps. They are: ', roomRtpCaps);
  //       const response = createResponse('getRouterRtpCapabilities', msg.id, {
  //         wasSuccess: true,
  //         data: roomRtpCaps,
  //       });
  //       this.send(response);
  //       break;
  //     }
  //     // case 'findGatheringByName': {
  //     //   let response: ResponseTo<'findGatheringByName'>;
  //     //   try{
  //     //     const foundGathering = Gathering.getGathering({name: msg.data.name});
  //     //     response = createResponse('findGatheringByName', msg.id, {
  //     //       wasSuccess: true,
  //     //       data: { id: foundGathering.id }
  //     //     });
  //     //   } catch(e){
  //     //     response = createResponse('findGatheringByName', msg.id, {
  //     //       wasSuccess: false,
  //     //       message: extractMessageFromCatch(e, 'failed to get gathering'),
  //     //     }) ;
  //     //   }
  //     //   this.send(response);

  //     //   break;
  //     // }
  //     // case 'createGathering': {
  //     //   let response: ResponseTo<'createGathering'>;
  //     //   try{

  //     //     const gathering = await Gathering.createGathering(undefined, msg.data.gatheringName);
  //     //     response = createResponse('createGathering', msg.id, {
  //     //       data: gathering.gatheringState,
  //     //       wasSuccess: true,
  //     //     });
  //     //   } catch (e) {
  //     //     response = createResponse('createGathering', msg.id, {
  //     //       wasSuccess: false,
  //     //       message: extractMessageFromCatch(e, 'failed to create gathering!'),
  //     //     });
  //     //   }
  //     //   this.send(response);
  //     //   break;
  //     // }
  //     // case 'joinGathering': {
  //     //   let response: ResponseTo<'joinGathering'>;
  //     //   try{

  //     //     const prevGathering = this.gathering;
  //     //     if(prevGathering) {
  //     //       if(prevGathering.id === msg.data.gatheringId){
  //     //         throw new Error('Already in that gathering. No need to join!');
  //     //       } else {
  //     //         prevGathering.removeClient(this);
  //     //         this.setGathering(undefined);
  //     //       }
  //     //     }
  //     //     const gathering = Gathering.getGathering({id: msg.data.gatheringId});
  //     //     if(!gathering){
  //     //       throw new Error('Cant join that gathering. Does not exist');
  //     //     }
  //     //     const clientRole = this.userData.role;
  //     //     const isPriviliged = hasAtLeastSecurityLevel(clientRole, 'admin');
  //     //     if(!isPriviliged && this.userData.gathering !== gathering.name){
  //     //       throw Error('not authorized to join gathering!');
  //     //     }
  //     //     gathering.addClient(this);
  //     //     response = createResponse('joinGathering', msg.id, {
  //     //       data: gathering.gatheringState,
  //     //       wasSuccess: true,
  //     //     });
  //     //   } catch (e){
  //     //     this.setGathering(undefined);
  //     //     response = createResponse('joinGathering', msg.id, {
  //     //       wasSuccess: false,
  //     //       message: extractMessageFromCatch(e, 'failed to join gathering!!! Very inconvenient!'),
  //     //     });
  //     //   }
  //     //   this.send(response);
  //     //   break;
  //     // }
  //     // case 'leaveGathering': {
  //     //   const response = createResponse('leaveGathering', msg.id, {
  //     //     wasSuccess: true,
  //     //   });
  //     //   try {
  //     //     if(!this.gathering){
  //     //       throw Error('not in a gathering. Thus cant leave one');
  //     //     }
  //     //     this.gathering.removeClient(this);
  //     //     // this.setGathering(undefined);
  //     //   } catch(e){
  //     //     response.wasSuccess = false;
  //     //     const msg = extractMessageFromCatch(e, 'failed to leave gathering');
  //     //     response.message = msg;
  //     //   }
  //     //   this.send(response);
  //     //   break;
  //     // }
  //     // case 'getGatheringState': {
  //     //   let response: ResponseTo<'getGatheringState'>;
  //     //   try{
  //     //     if(!this.gathering){
  //     //       throw new Error('cant list rooms if isnt in a gathering');
  //     //     }
  //     //     const gatheringState = this.gathering.gatheringState;
  //     //     response = createResponse('getGatheringState', msg.id, {
  //     //       wasSuccess: true,
  //     //       data: gatheringState
  //     //     });
  //     //   } catch (e) {
  //     //     response = createResponse('getGatheringState', msg.id, {
  //     //       wasSuccess: false,
  //     //       message: extractMessageFromCatch(e, 'failed to get gathering state! You cry!'),
  //     //     });
  //     //   }
  //     //   this.send(response);
  //     //   break;
  //     // }
  //     case 'findRoomByName': {
  //       let response: ResponseTo<'findRoomByName'>;
  //       try {
  //         if(!this.gathering){
  //           throw new Error('not in a gathering. Must be in a gathering to search for rooms');
  //         }
  //         const room = this.gathering.getRoom({name: msg.data.roomName});
  //         response = createResponse('findRoomByName', msg.id, {
  //           wasSuccess: true,
  //           data: {id: room.id }
  //         });
  //       } catch(e){
  //         response = createResponse('findRoomByName', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to get room')
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'createRoom': {
  //       let response: ResponseTo<'createRoom'>;
  //       try {
  //         if(!this.gathering){
  //           throw new Error('no gathering to put the created room in!!!');
  //         }
  //         const roomName = msg.data.name;
  //         if(!roomName){
  //           throw Error('invalid roomName provided!');
  //         }
  //         const room = this.gathering.createRoom({roomName});
  //         response = createResponse('createRoom', msg.id, {
  //           wasSuccess: true,
  //           data: room.roomState,
  //         });
  //       } catch (e) {
  //         response = createResponse('createRoom', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to create room!!')
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'setRoomName': {
  //       let response: ResponseTo<'setRoomName'>;
  //       try{
  //         if(!this.gathering){
  //           throw Error('must be in a gathering to set room name');
  //         }
  //         const room = this.gathering.getRoom({id: msg.data.roomId });
  //         if(!room){
  //           throw Error('no room with that id found');
  //         }
  //         room.roomName = msg.data.roomName;
  //         this.gathering.broadCastGatheringState(undefined, 'a room changed name');
  //         response = createResponse('setRoomName', msg.id, {
  //           wasSuccess: true,
  //         });
  //       } catch(e) {
  //         response = createResponse('setRoomName', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to set name for room'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'joinRoom': {
  //       this.leaveCurrentRoom(false);
  //       let response: ResponseTo<'joinRoom'>;
  //       try{

  //         if(!this.gathering){
  //           throw Error('not in a gathering. Can not join a room without being in a gathering');
  //         }
  //         const roomId = msg.data.roomId;
  //         const foundRoom = this.gathering.getRoom({id: roomId});
  //         foundRoom.addClient(this);
  //         response = createResponse('joinRoom', msg.id, {
  //           data: foundRoom.roomState,
  //           wasSuccess: true,
  //         });
  //       } catch(e){
  //         this.setRoom(undefined);
  //         response = createResponse('joinRoom', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, `failed to joinRoom: ${msg.data.roomId}`)
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'requestToJoinRoom': {
  //       // TODO: PRIORITY! I realised it would be much smoother if room allowance was implemented as a waiting list as part of the roomstate.
  //       // Then the host can freely "tick off" waiting clients and let them in. Also we could skip the dialog.
  //       let response: ResponseTo<'requestToJoinRoom'>;
  //       const roomId = msg.data.roomId;
  //       try {
  //         if(!this.gathering){
  //           throw Error('Not in a gathering, Cant request to join if not in a gathering');
  //         }
  //         const foundRoom = this.gathering.getRoom({id: roomId});
  //         const req = createRequest('forwardedRequestToJoinRoom', {
  //           roomId: msg.data.roomId,
  //           clientId: this.id,
  //         });
  //         await foundRoom.broadcastRequest(req, 'moderator', 30000);
  //         this.setRoom(foundRoom.id);
  //         foundRoom.addClient(this);
  //         response = createResponse('requestToJoinRoom', msg.id, {
  //           data: foundRoom.roomState,
  //           wasSuccess: true,
  //         });
  //       }catch( e) {
  //         response = createResponse('requestToJoinRoom', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, `failed to joinRoom: ${msg.data.roomId}`)
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'removeClientFromRoom': {
  //       let response: ResponseTo<'removeClientFromRoom'>;
  //       try {

  //         const roomId = msg.data.roomId;
  //         const clientId = msg.data.clientId;

  //         if(this.id === clientId){
  //           throw Error('cant remove oneself from a room. Use the leaveRoom request instead.');
  //         }
  //         if(!this.gathering) {
  //           throw Error('not in a gathering. must be in one to remove a client from room');
  //         }
  //         const room = this.gathering.getRoom({id: roomId});

  //         const client = room.clients.get(clientId);
  //         if(!client){
  //           throw Error('no client with that id was found in room');
  //         }
  //         client.closeAndNotifyAllConsumers();
  //         client.closeAndNotifyAllProducers();
  //         room.removeClient(client);
  //         response = createResponse('removeClientFromRoom', msg.id, {
  //           wasSuccess: true,
  //         });
  //       } catch(e) {
  //         response = createResponse('removeClientFromRoom', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to remove client from room'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'closeAllProducersForClient': {

  //       let response: ResponseTo<'closeAllProducersForClient'>;
  //       try {
  //         const clientId = msg.data.clientId;
  //         if(!this.gathering) {
  //           throw Error('not in a gathering. Must be in one when closing a clients all producers');
  //         }
  //         if(!this.room) {
  //           throw Error('not in a room. Must be in same room as client you want to close!');
  //         }
  //         const client = this.room.clients.get(clientId);
  //         if(!client) {
  //           throw Error('no client with that id found in current room!');
  //         }
  //         // client.producers.forEach(producer => producer.pause());
  //         client.closeAndNotifyAllProducers();
  //         response = createResponse('closeAllProducersForClient', msg.id, {wasSuccess: true});
  //       } catch(e){
  //         response = createResponse('closeAllProducersForClient', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to close all producers for client')});
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'pauseAllProducersForClient': {
  //       let response: ResponseTo<'pauseAllProducersForClient'>;
  //       try {
  //         const clientId = msg.data.clientId;
  //         if(!this.gathering) {
  //           throw Error('must be in gathering when pausing a clients all producers');
  //         }
  //         if(!this.room) {
  //           throw Error('not in a room. Must be in same room as the client you want to pause');
  //         }
  //         const client = this.room.clients.get(clientId);
  //         if(!client) {
  //           throw Error('no client with that id found in current room!');
  //         }
  //         client.producers.forEach(producer => {
  //           (producer.appData.producerInfo as ProducerInfo).paused = true;
  //           producer.pause();
  //         });
  //         response = createResponse('pauseAllProducersForClient', msg.id, { wasSuccess: true });
  //         client.onClientStateUpdated('clients producers were paused by host');
  //       } catch (e) {
  //         response = createResponse('pauseAllProducersForClient', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to pause the clients all producers')});
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'setForceMuteStateForClient': {
  //       let response: ResponseTo<'setForceMuteStateForClient'>;
  //       try {
  //         const clientId = msg.data.clientId;
  //         const muteState = msg.data.forceMuted;
  //         if(!this.gathering) {
  //           throw Error('not in a gathering. Must be in one when muting a client');

  //         }
  //         if(!this.room) {
  //           throw Error('not in a room. Must be in same room as client you want to mute!');
  //         }
  //         const client = this.room.clients.get(clientId);
  //         if(!client) {
  //           throw Error('no client with that id found in current room!');
  //         }
  //         if(muteState){
  //           client.producers.forEach(producer => {
  //             (producer.appData.producerInfo as ProducerInfo).paused = muteState;
  //             producer.pause();
  //           });
  //         }
  //         // client.closeAndNotifyAllProducers();
  //         client.setCustomProperties({forceMuted: muteState});
  //         response = createResponse('setForceMuteStateForClient', msg.id, {wasSuccess: true});
  //       } catch(e){
  //         response = createResponse('setForceMuteStateForClient', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to set force mute state')});
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'setForceMuteStateForProducer': {
  //       let response: ResponseTo<'setForceMuteStateForProducer'>;
  //       try {
  //         const clientId = msg.data.clientId;
  //         const producerId = msg.data.producerId;
  //         const muteState = msg.data.forceMuted;
  //         if(!this.gathering) {
  //           throw Error('not in a gathering. Must be in one when muting a client');

  //         }
  //         if(!this.room) {
  //           throw Error('not in a room. Must be in same room as client you want to mute!');
  //         }
  //         const client = this.room.clients.get(clientId);
  //         if(!client) {
  //           throw Error('no client with that id found in current room!');
  //         }

  //         const producer = client.producers.get(producerId);
  //         if(!producer) {
  //           throw Error('client has no producer with that id');
  //         }
  //         if(!producer.appData.producerInfo)
  //           producer.appData.producerInfo = {};
  //         // TODO: Actually fix this!
  //         (producer.appData.producerInfo as ProducerInfo).forceMuted = muteState;
  //         if(muteState){
  //           producer.pause();
  //         }
  //         response = createResponse('setForceMuteStateForProducer', msg.id, {wasSuccess: true});
  //         this.room.broadcastRoomState('forceMuteState changed for a client');
  //       } catch(e) {
  //         response = createResponse('setForceMuteStateForProducer', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to set force mute state')});
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'leaveRoom': {
  //       let response: ResponseTo<'leaveRoom'>;
  //       try {
  //         const roomId = this.leaveCurrentRoom();
  //         response = createResponse('leaveRoom', msg.id, { wasSuccess: true, data: { roomId: roomId}});
  //       } catch(e) {
  //         response= createResponse('leaveRoom', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to leave room for some reason')});
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'createSendTransport': {
  //       let response: ResponseTo<'createSendTransport'>;
  //       try {
  //         const transportOptions = await this.createWebRtcTransport('send');
  //         response = createResponse('createSendTransport', msg.id, {
  //           wasSuccess: true,
  //           data: transportOptions,
  //         });

  //       } catch (e) {
  //         response = createResponse('createSendTransport', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to create send transport :-(')
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'createReceiveTransport': {
  //       let response:ResponseTo<'createReceiveTransport'>;
  //       try {

  //         const transportOptions = await this.createWebRtcTransport('receive');
  //         response = createResponse('createReceiveTransport', msg.id, {
  //           wasSuccess: true,
  //           data: transportOptions,
  //         });
  //       } catch (e) {

  //         response = createResponse('createReceiveTransport', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to create receive transport')
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'connectTransport': {
  //       const transportId = msg.data.transportId;
  //       const dtlsParameters = msg.data.dtlsParameters;
  //       let chosenTransport;
  //       try {
  //         if(transportId === this.receiveTransport?.id){
  //           chosenTransport = this.receiveTransport;
  //         } else if(transportId === this.sendTransport?.id){
  //           chosenTransport = this.sendTransport;
  //         } else{
  //           throw new Error('no transport with that id on server-side');
  //         }
  //         await chosenTransport.connect({dtlsParameters});
  //         const response = createResponse('connectTransport', msg.id, {
  //           wasSuccess: true,
  //         });
  //         this.send(response);
  //       } catch (e) {
  //         const response = createResponse('connectTransport', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'connectTransport failed'),
  //         });
  //         this.send(response);
  //       }
  //       break;
  //     }
  //     case 'notifyCloseEventRequest': {
  //       let response: ResponseTo<'notifyCloseEventRequest'>;

  //       try{
  //         switch (msg.data.objectType) {
  //           case 'consumer': {
  //             const consumer = this.consumers.get(msg.data.objectId);
  //             if(!consumer) throw new Error('no consumer with that is found! cant close it');
  //             consumer.close();
  //             this.consumers.delete(msg.data.objectId);
  //             response = createResponse('notifyCloseEventRequest', msg.id, {wasSuccess: true});
  //             break;
  //           }
  //           case 'producer': {
  //             const producer = this.producers.get(msg.data.objectId);
  //             if(!producer) throw new Error('no producer with that id found!!cant close it');
  //             producer.close();
  //             this.producers.delete(msg.data.objectId);
  //             response = createResponse('notifyCloseEventRequest', msg.id, { wasSuccess: true });
  //             break;
  //           }
  //           default:{
  //             throw Error(`notifyCloseHandler not implemented for objectType: ${msg.data.objectType}`);
  //           }
  //         }
  //       } catch(e){
  //         response = createResponse('notifyCloseEventRequest', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to close the corresponding server side object'),
  //         });
  //       }
  //       this.send(response);
  //       this.onClientStateUpdated(`close event notified for a ${msg.data.objectType}`);
  //       break;
  //     }
  //     case 'assignMainProducerToRoom': {
  //       let response: ResponseTo<'assignMainProducerToRoom'>;
  //       const reqParams = msg.data;
  //       try {
  //         const room = this.gathering?.getRoom({id: reqParams.roomId});
  //         if(!room) {
  //           throw new Error('no such room maddafakka!');
  //         }
  //         const producer = this.gathering?.getClient(reqParams.clientId).producers.get(reqParams.producerId);
  //         if(!producer){
  //           throw new Error('no such producer found!');
  //         }
  //         if(reqParams.mediaKind === 'video'){
  //           room.mainProducers.video = producer;
  //         } else if(reqParams.mediaKind === 'audio'){
  //           room.mainProducers.audio = producer;
  //         }
  //         this.gathering?.broadCastGatheringState(undefined, 'mainProducer assigned to a room');
  //         response = createResponse('assignMainProducerToRoom', msg.id, {
  //           wasSuccess: true,
  //         });
  //       } catch(e){
  //         response = createResponse('assignMainProducerToRoom', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to assign producer to room!! Now cry!'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'createProducer': {
  //       // A producer on server side represents a client producing media and sending it to the server.
  //       let response: ResponseTo<'createProducer'>;
  //       try {
  //         if(!this.sendTransport){
  //           throw Error('sendTransport is undefined. Need a sendtransport to produce');
  //         } else if(this.sendTransport.id !== msg.data.transportId){
  //           throw Error('the provided transporId didnt match the id of the sendTransport');
  //         }
  //         const {kind, rtpParameters, producerInfo} = msg.data;
  //         const appData = { producerInfo };
  //         const producer = await this.sendTransport.produce({ kind, rtpParameters, appData});
  //         producer.on('transportclose', () => {
  //           console.log(`transport for producer ${producer.id} was closed`);
  //           this.producers.delete(producer.id);
  //           this.send(createMessage('notifyCloseEvent', {
  //             objectType: 'producer',
  //             objectId: producer.id,
  //           }));
  //           this.onClientStateUpdated('transport for a producer closed');
  //         });
  //         this.producers.set(producer.id, producer);
  //         // if(this.role === 'admin'){
  //         //   this.gathering?.broadCastGatheringState();
  //         // }
  //         this.onClientStateUpdated('producer created');
  //         response = createResponse('createProducer', msg.id, { wasSuccess: true, data: {producerId: producer.id}});
  //       } catch(e){
  //         const err = extractMessageFromCatch(e);
  //         response = createResponse('createProducer', msg.id, {
  //           wasSuccess: false,
  //           message: err,
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'createConsumer': {
  //       let response:ResponseTo<'createConsumer'>;
  //       try {
  //         if(!this.room){
  //           throw Error('not in a room. Duuude, thats required to create consumer');
  //         }
  //         if(!this.gathering){
  //           throw Error('not in a gathering! No bueno, sir!');
  //         }
  //         if(!this.rtpCapabilities){
  //           throw Error('rtpCapabilities of peer unknown. Provide them before requesting to consume');
  //         }
  //         const requestedProducerId = msg.data.producerId;
  //         const canConsume = this.gathering.router.canConsume({producerId: requestedProducerId, rtpCapabilities: this.rtpCapabilities});
  //         if( !canConsume){
  //           throw Error('Client is not capable of consuming the producer according to provided rtpCapabilities');
  //         }
  //         const producer = this.room.producers.get(requestedProducerId);
  //         if(!producer){
  //           throw Error('no producer with that id found in current room!');
  //         }

  //         if(!this.receiveTransport){
  //           throw Error('A transport is required to create a consumer');
  //         }

  //         const consumer = await this.receiveTransport.consume({
  //           producerId: producer.id,
  //           rtpCapabilities: this.rtpCapabilities,
  //           paused: true,
  //         });

  //         this.consumers.set(consumer.id, consumer);

  //         consumer.on('transportclose', () => {
  //           console.log(`---consumer transport close--- client: ${this.id} consumer_id: ${consumer.id}`);
  //           this.send(createMessage('notifyCloseEvent', {
  //             objectType: 'consumer',
  //             objectId: consumer.id,
  //           }));
  //           this.consumers.delete(consumer.id);
  //           this.onClientStateUpdated('transport for a consumer closed');
  //         });

  //         consumer.on('producerclose', () => {
  //           console.log(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
  //           this.send(createMessage('notifyCloseEvent', {
  //             objectType: 'consumer',
  //             objectId: consumer.id
  //           }));
  //           this.consumers.delete(consumer.id);
  //         });

  //         consumer.on('producerpause', () => {
  //           console.log('producer was paused! Handler NOT IMPLEMENTED YET!');
  //         });
  //         consumer.on('producerresume', () => {
  //           console.log('producer was resumed! Handler NOT IMPLEMENTED YET!');
  //         });

  //         const {id, producerId, kind, rtpParameters} = consumer;

  //         response = createResponse('createConsumer', msg.id, {
  //           wasSuccess: true,
  //           data: {
  //             id, producerId, kind, rtpParameters
  //           }
  //         });
  //       } catch (e) {
  //         response = createResponse('createConsumer', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to create consumer'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'notifyPauseResumeRequest': {
  //       console.log('received notify Pause resume:', msg.data);
  //       let response: ResponseTo<'notifyPauseResumeRequest'>;
  //       try {
  //         let prodcon: soupTypes.Producer | soupTypes.Consumer | undefined;
  //         if(msg.data.objectType == 'consumer') {
  //           prodcon = this.consumers.get(msg.data.objectId);
  //         } else {
  //           prodcon = this.producers.get(msg.data.objectId);
  //         }
  //         if(!prodcon){
  //           throw new Error('no producer/consumer found');
  //         }
  //         if(msg.data.wasPaused){
  //           await prodcon.pause();
  //         } else {
  //           await prodcon.resume();
  //         }
  //         if(typeof prodcon.appData.producerInfo !== 'object'){
  //           prodcon.appData.producerInfo = {};
  //         }
  //         // TODO: Typescript is harsh...
  //         (prodcon.appData.producerInfo as ProducerInfo).paused = msg.data.wasPaused;
  //         response = createResponse('notifyPauseResumeRequest', msg.id, {
  //           wasSuccess: true,
  //         });
  //       } catch (e) {
  //         response = createResponse('notifyPauseResumeRequest', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to change playing state of producer/consumer')
  //         });
  //       }
  //       this.send(response);
  //       this.onClientStateUpdated(`pause/resume event notified for a ${msg.data.objectType}`);
  //       break;
  //     }
  //     case 'setCustomClientProperties': {
  //       let response: ResponseTo<'setCustomClientProperties'>;
  //       try {

  //         this.setCustomProperties(msg.data);
  //         // this.send(createSuccessResponse(msg));
  //         response = createResponse('setCustomClientProperties', msg.id, { wasSuccess: true });
  //       } catch (e) {
  //         response = createResponse('setCustomClientProperties', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to set custom props on client')});
  //         // const failString = extractMessageFromCatch(e, 'failed to set custom props on client');
  //         // this.send(createFailResponse(msg, failString));
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     case 'setCustomRoomProperties': {
  //       let response: ResponseTo<'setCustomRoomProperties'>;
  //       try {
  //         if(!this.gathering) {
  //           throw Error('must be in a gathering to set properties for a room');
  //         }

  //         const room = this.gathering.getRoom({id: msg.data.roomId});
  //         room.setCustomProperties(msg.data.properties);
  //         response = createResponse('setCustomRoomProperties', msg.id, {
  //           wasSuccess: true,
  //         });
  //       } catch(e) {
  //         response = createResponse('setCustomRoomProperties', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to set custom properties'),
  //         });
  //       }
  //       this.send(response);
  //       break;
  //     }
  //     default:
  //       break;
  //   }
  // };

  // get clientState(){
  //   const producers: ClientState['producers'] = {};
  //   for(const [_, producer] of this.producers){

  //     producers[producer.id] = {
  //       producerId: producer.id,
  //       kind: producer.kind,
  //     };
  //     if(producer.appData.producerInfo){
  //       //TODO: Can we avoid type casting please!
  //       producers[producer.id].producerInfo = producer.appData.producerInfo as ProducerInfo;
  //     }
  //   }
  //   const state: ClientState = {
  //     clientId: this.id,
  //     username: this.userName,
  //     customProperties: this.customProperties,
  //     connected: this.connected,
  //     role: this.role,
  //     producers: producers,
  //   };
  //   if(this.gathering){
  //     state.gatheringId = this.gathering.id;
  //   }
  //   if(this.room){
  //     state.roomId = this.room.id;
  //   }
  //   return state;
  // }

  // Not sure yet if we can rely on always broadcasting to room if inside one and send to self if not.
  // Also, how about gatherings? Do we sometimes want to broadcast clientstate changes on gathering level?
  // onClientStateUpdated(reason?: string) {
  //   if(!reason) reason = 'reason not specified';
  //   if(this.room){
  //     this.room.broadcastRoomState(reason);
  //   } else {
  //     this.send(createMessage('clientStateUpdated', {
  //       newState: this.clientState,
  //       reason}));
  //   }
  // }

  // setCustomProperties (props: ClientProperties)  {
  //   for(const [key, prop] of Object.entries(props)) {
  //     this.customProperties[key] = prop;
  //   }
  //   this.onClientStateUpdated('a client changed custom properties');
  // }

  // private leaveCurrentRoom(): string;
  // private leaveCurrentRoom(throwIfNonExistent: true): string;
  // private leaveCurrentRoom(throwIfNonExistent: false): string | undefined;
  // private leaveCurrentRoom(throwIfNonExistent = true){
  //   if(!this.room){
  //     if(throwIfNonExistent){
  //       throw Error('not in a room. thus cant leave one');
  //     }
  //     return;
  //   }
  //   this.closeAndNotifyAllConsumers();
  //   this.closeAndNotifyAllProducers();
  //   this.sendTransport?.close();
  //   this.sendTransport = undefined;
  //   this.receiveTransport?.close();
  //   this.receiveTransport = undefined;
  //   const roomId = this.room.id;
  //   this.room.removeClient(this);
  //   return roomId;
  // }


  // closeAndNotifyConsumer(consumerId: string){
  //   const consumer = this.consumers.get(consumerId);
  //   if(!consumer){
  //     throw Error('no consumer with that id. cant close it');
  //   }
  //   consumer.close();
  //   this.send(createMessage('notifyCloseEvent', {
  //     objectType: 'consumer',
  //     objectId: consumerId,
  //   }));

  //   this.consumers.delete(consumerId);
  // }

  // async createWebRtcTransport(direction: 'send' | 'receive'){
  //   if(!this.gathering) {
  //     throw Error('must be in a gathering in order to create transport');
  //   }
  //   const transport = await this.gathering.createWebRtcTransport();
  //   if(!transport){
  //     throw new Error('failed to create transport!!');
  //   }
  //   transport.addListener('routerclose', () => {
  //     this.send(createMessage('notifyCloseEvent', {
  //       objectType: 'transport',
  //       objectId: transport.id,
  //     }));
  //   });
  //   if(direction == 'receive'){
  //     this.receiveTransport = transport;
  //     this.receiveTransport.addListener('routerclose', ()=> {
  //       this.receiveTransport = undefined;
  //     });
  //   } else {
  //     this.sendTransport = transport;
  //     this.sendTransport.addListener('routerclose',()=> {
  //       this.sendTransport = undefined;
  //     });
  //   }
  //   const { id, iceParameters, dtlsParameters } = transport;
  //   const iceCandidates = <soupClientTypes.IceCandidate[]>transport.iceCandidates;
  //   const transportOptions: soupClientTypes.TransportOptions = {
  //     id,
  //     iceParameters,
  //     iceCandidates,
  //     dtlsParameters,
  //   };

  //   return transportOptions;

  // }


  // /**
  //  * I would prefer to not need this function. but uWebsockets is not attaching incoming messages to the socket object itself, but rather the server.
  //  * Thus we have to propagate the message "down" to the socketWrapper
  //  */
  // EDIT: I made an ugly hack so we instead can access the socket instance directly from index.ts
  // (typescript (still?) only checks access of private members on build so we ignore that and access it directly in js)
  // incomingMessage(msg: InternalMessageType){
  //   this.ws.incomingMessage(msg);
  // }
}
