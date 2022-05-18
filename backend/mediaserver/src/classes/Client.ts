import { randomUUID } from 'crypto';
import SocketWrapper from './SocketWrapper';
import {types as soupTypes} from 'mediasoup';
import {types as soupClientTypes} from 'mediasoup-client';
import { ClientState, UserData, UserRole } from 'shared-types/CustomTypes';
import { AnyRequest, createMessage, createRequest, createResponse, Request, RequestSubjects, ResponseTo, SocketMessage, UnknownMessageType } from 'shared-types/MessageTypes';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
// import { checkPermission } from '../modules/utilFns';
import { checkPermission } from '../modules/utilFns';

import Gathering from './Gathering';



interface constructionParams {
  id?: string,
  ws: SocketWrapper,
  userData: UserData,
}
/**
 * This class represents a client in the backend. This class is also responsible for the communication with the "actual" client (i.e. the frontend).
 */
export default class Client {
  id: string;
  private ws: SocketWrapper;

  // TODO userdata should probably be required field in this class?!
  userData: UserData;
  get userName(): string{
    // if(this.userData?.username){
    return this.userData.username;
    // }
    return 'John Doe';
  }
  get role (): UserRole {
    // if(this.userData?.role){
    return this.userData.role;
    // }
    // return 'guest';
  }
  connected = true;


  rtpCapabilities?: soupTypes.RtpCapabilities;
  receiveTransport?: soupTypes.WebRtcTransport;
  sendTransport?: soupTypes.WebRtcTransport;
  consumers: Map<string, soupTypes.Consumer> = new Map();
  producers: Map<string, soupTypes.Producer> = new Map();

  customProperties: Record<string, unknown> = {};

  private gatheringId?: string;
  setGathering(gatheringId: string | undefined){
    this.gatheringId = gatheringId;
  }
  get gathering() {
    try{
      if(!this.gatheringId) return undefined;
      return Gathering.getGathering({id: this.gatheringId });
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }


  private roomId?: string;
  setRoom(roomId: string | undefined){
    this.roomId = roomId;
  }
  get room() {
    try {
      if(!this.roomId) return undefined;
      return this.gathering?.getRoom({ id: this.roomId });
    } catch(e) {
      console.error(e);
      return undefined;
    }
  }

  constructor({id = randomUUID(), ws, userData}: constructionParams){
    this.id = id;
    this.ws = ws;
    this.userData = userData;
    // this.nickName = userData.username;


    ws.registerReceivedMessageCallback((msg) => {
      console.log('client received message:', msg);
      this.handleReceivedMsg(msg);
    });
    this.onClientStateUpdated('server side client instance created');
  }

  assignSocketWrapper(ws: SocketWrapper){
    this.ws = ws;
  }

  private handleReceivedMsg = async (msg: SocketMessage<UnknownMessageType>) => {
    if(msg.type === 'response'){
      console.error('message handler called with response message. That should not happen!!', msg);
      return;
    }
    if(msg.type === 'message'){
      //TODO: Handle the message type
      console.log('received normal message (not request)');
      console.warn('No message handlers implemented!!!');
      return;
    }
    if(!msg.id){
      console.error('no id in received request!!!');
      return;
    }
    //check authorization
    if(!checkPermission(this.userData.role, msg.subject)){
      const response = createResponse(msg.subject, msg.id, {
        wasSuccess: false,
        message: 'NOT AUTHORIZED!!!! Get outta here!!'
      });
      this.send(response);
      return;
    }
    // console.log('received Request!!');
    switch (msg.subject) {
      case 'setName': {
        this.send(createResponse('setName', msg.id, {
          wasSuccess: false,
          message: 'NOT IMPLEMENTED YET!!! GO AWAAAY!',
        }));
        // this.nickName = msg.data.name;
        // const response = createResponse('setName', msg.id, {
        //   wasSuccess: true,
        // });
        // this.send(response);
        break;
      }
      case 'getClientState': {
        let response: ResponseTo<'getClientState'>;
        try{
          response = createResponse('getClientState', msg.id, { wasSuccess: true, data: this.clientState});
        } catch( e){
          response = createResponse('getClientState', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to get clientState'),
          });
        }
        this.send(response);
        break;
      }
      case 'setRtpCapabilities': {
        this.rtpCapabilities = msg.data;
        const response = createResponse('setRtpCapabilities', msg.id, {
          wasSuccess: true
        });
        this.send(response);
        break;
      }
      case 'getRouterRtpCapabilities': {
        // const response = {
        //   type: 'dataResponse',
        //   subject: 'getRouterRtpCapabilities',
        //   isResponse: true,
        // } as UnfinishedResponse<GetRouterRtpCapabilitiesResponse>;
        if(!this.gathering){
          console.warn('Client requested router capabilities without being in a gathering');
          const response = createResponse('getRouterRtpCapabilities', msg.id, {
            wasSuccess: false,
            message: 'not in a gathering. Must be in gathering to request RtpCapabilities',
          });
          this.send(response);
          return;
        }
        const roomRtpCaps = this.gathering.getRtpCapabilities();
        // console.log('client want routerRtpCaps. They are: ', roomRtpCaps);
        const response = createResponse('getRouterRtpCapabilities', msg.id, {
          wasSuccess: true,
          data: roomRtpCaps,
        });
        this.send(response);
        break;
      }
      case 'findGatheringByName': {
        let response: ResponseTo<'findGatheringByName'>;
        try{
          const foundGathering = Gathering.getGathering({name: msg.data.name});
          response = createResponse('findGatheringByName', msg.id, {
            wasSuccess: true,
            data: { id: foundGathering.id }
          });
        } catch(e){
          response = createResponse('findGatheringByName', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to get gathering'),
          }) ;
        }
        this.send(response);

        break;
      }
      case 'createGathering': {
        let response: ResponseTo<'createGathering'>;
        try{

          const gathering = await Gathering.createGathering(undefined, msg.data.gatheringName);
          response = createResponse('createGathering', msg.id, {
            data: gathering.gatheringState,
            wasSuccess: true,
          });
        } catch (e) {
          response = createResponse('createGathering', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to create gathering!'),
          });
        }
        this.send(response);
        break;
      }
      case 'joinGathering': {
        let response: ResponseTo<'joinGathering'>;
        try{ 

          const prevGathering = this.gathering;
          if(prevGathering) {
            if(prevGathering.id === msg.data.gatheringId){
              throw new Error('Already in that gathering. No need to join!');
            } else {
              prevGathering.removeClient(this);
              this.setGathering(undefined);
            } 
          }
          // IMPORTANT
          // TODO: Implement logic here (or elsewhere?) that checks whether the user is authorized to join that gathering or not
          const gathering = Gathering.getGathering({id: msg.data.gatheringId});
          if(!gathering){
            throw new Error('Cant join that gathering. Does not exist');
          }
          // ORDER MATTERS HERE! the gathering will read the client's gathering field when broadcasting,
          // so we need to set it before calling 'addClient'.
          this.setGathering(gathering.id);
          gathering.addClient(this);
          response = createResponse('joinGathering', msg.id, {
            data: gathering.gatheringState,
            wasSuccess: true,
          });
        } catch (e){
          this.setGathering(undefined);
          response = createResponse('joinGathering', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to join gathering!!! Very inconvenient!'),
          });
        }
        this.send(response);
        break;
      }
      case 'leaveGathering': {
        const response = createResponse('leaveGathering', msg.id, {
          wasSuccess: true,
        });
        try {
          if(!this.gathering){
            throw Error('not in a gathering. Thus cant leave one');
          }
          this.gathering.removeClient(this);
          this.setGathering(undefined);
        } catch(e){
          response.wasSuccess = false;
          const msg = extractMessageFromCatch(e, 'failed to leave gathering');
          response.message = msg;
        }
        this.send(response);
        break; 
      }
      case 'getGatheringState': {
        let response: ResponseTo<'getGatheringState'>;
        try{
          if(!this.gathering){
            throw new Error('cant list rooms if isnt in a gathering');
          }
          const gatheringState = this.gathering.gatheringState;
          response = createResponse('getGatheringState', msg.id, {
            wasSuccess: true,
            data: gatheringState
          });
        } catch (e) {
          response = createResponse('getGatheringState', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to get gathering state! You cry!'),
          });
        }
        this.send(response);
        break;
      }
      case 'findRoomByName': {
        let response: ResponseTo<'findRoomByName'>;
        try {
          if(!this.gathering){
            throw new Error('not in a gathering. Must be in a gathering to search for rooms');
          }
          const room = this.gathering.getRoom({name: msg.data.roomName});
          response = createResponse('findRoomByName', msg.id, {
            wasSuccess: true,
            data: {id: room.id }
          });
        } catch(e){
          response = createResponse('findRoomByName', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to get room')
          });
        }
        this.send(response);
        break;
      }
      case 'createRoom': {
        let response: ResponseTo<'createRoom'>;
        try {
          if(!this.gathering){
            throw new Error('no gathering to put the created room in!!!');
          }
          const roomName = msg.data.name;
          if(!roomName){
            throw Error('invalid roomName provided!');
          }
          const room = this.gathering.createRoom({roomName});
          response = createResponse('createRoom', msg.id, {
            wasSuccess: true,
            data: room.roomState,
          });
        } catch (e) {
          response = createResponse('createRoom', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to create room!!')
          }); 
        }
        this.send(response);
        break;
      }

      case 'joinRoom': {
        this.leaveCurrentRoom(false);
        //default to fail message
        let response: ResponseTo<'joinRoom'>;
        try{

          if(!this.gathering){
            throw Error('not in a gathering. Can not join a room without being in a gathering');
          }
          const roomId = msg.data.roomId;
          const foundRoom = this.gathering.getRoom({id: roomId});
          this.setRoom(foundRoom.id);
          foundRoom.addClient(this);
          response = createResponse('joinRoom', msg.id, {
            data: foundRoom.roomState,
            wasSuccess: true,
          });
        } catch(e){
          this.setRoom(undefined);
          response = createResponse('joinRoom', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, `failed to joinRoom: ${msg.data.roomId}`)
          });
        }
        this.send(response);
        break;
      }
      case 'requestToJoinRoom': {
        let response: ResponseTo<'requestToJoinRoom'>;
        const roomId = msg.data.roomId;
        try {
          if(!this.gathering){
            throw Error('Not in a gathering, Cant request to join if not in a gathering');
          }
          const foundRoom = this.gathering.getRoom({id: roomId});
          const req = createRequest('forwardedRequestToJoinRoom', {
            roomId: msg.data.roomId,
            clientId: this.id,
          });
          await foundRoom.broadcastRequest(req, 'host', 30000);
          this.setRoom(foundRoom.id);
          foundRoom.addClient(this);
          response = createResponse('requestToJoinRoom', msg.id, {
            data: foundRoom.roomState,
            wasSuccess: true,
          });
        }catch( e) {
          response = createResponse('requestToJoinRoom', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, `failed to joinRoom: ${msg.data.roomId}`)
          });
        }
        this.send(response);
        break; 
      }
      case 'leaveRoom': {
        let response: ResponseTo<'leaveRoom'>;
        try {
          const roomId = this.leaveCurrentRoom();
          response = createResponse('leaveRoom', msg.id, { wasSuccess: true, data: { roomId: roomId}});
        } catch(e) {
          response= createResponse('leaveRoom', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to leave room for some reason')});
        }
        this.send(response);
        break;
      }
      case 'createSendTransport': {
        let response: ResponseTo<'createSendTransport'>;
        try {
          const transportOptions = await this.createWebRtcTransport('send');
          response = createResponse('createSendTransport', msg.id, {
            wasSuccess: true,
            data: transportOptions,
          });

        } catch (e) {
          response = createResponse('createSendTransport', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to create send transport :-(')
          });
        }
        this.send(response);
        break;
      }
      case 'createReceiveTransport': {

        let response:ResponseTo<'createReceiveTransport'>;
        try {

          const transportOptions = await this.createWebRtcTransport('receive');
          response = createResponse('createReceiveTransport', msg.id, {
            wasSuccess: true,
            data: transportOptions,
          });
        } catch (e) {

          response = createResponse('createReceiveTransport', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to create receive transport')
          });
        }
        this.send(response);
        break;
      }
      case 'connectTransport': {
        const transportId = msg.data.transportId;
        const dtlsParameters = msg.data.dtlsParameters;
        let chosenTransport;
        try {
          if(transportId === this.receiveTransport?.id){
            chosenTransport = this.receiveTransport;
          } else if(transportId === this.sendTransport?.id){
            chosenTransport = this.sendTransport;
          } else{
            throw new Error('no transport with that id on server-side');
          }
          await chosenTransport.connect({dtlsParameters});
          const response = createResponse('connectTransport', msg.id, {
            wasSuccess: true,
          });
          this.send(response);
        } catch (e) {
          const response = createResponse('connectTransport', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'connectTransport failed'),
          });
          this.send(response);
        }
        break;
      }
      case 'notifyCloseEventRequest': {
        let response: ResponseTo<'notifyCloseEventRequest'>;

        try{
          switch (msg.data.objectType) {
            case 'consumer': {
              const consumer = this.consumers.get(msg.data.objectId);
              if(!consumer) throw new Error('no consumer with that is found! cant close it');
              consumer.close();
              this.consumers.delete(msg.data.objectId);
              response = createResponse('notifyCloseEventRequest', msg.id, {wasSuccess: true});
              break;
            }
            case 'producer': {
              const producer = this.producers.get(msg.data.objectId);
              if(!producer) throw new Error('no producer with that id found!!cant close it');
              producer.close();
              this.producers.delete(msg.data.objectId);
              response = createResponse('notifyCloseEventRequest', msg.id, { wasSuccess: true });
              break;
            }
            default:{
              throw Error(`notifyCloseHandler not implemented for objectType: ${msg.data.objectType}`);
            }
          }
        } catch(e){
          response = createResponse('notifyCloseEventRequest', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to close the corresponding server side object'),
          });
        }
        this.send(response);
        this.onClientStateUpdated(`close event notified for a ${msg.data.objectType}`);
        break;
      }
      case 'assignMainProducerToRoom': {
        let response: ResponseTo<'assignMainProducerToRoom'>;
        const reqParams = msg.data;
        try {
          const room = this.gathering?.getRoom({id: reqParams.roomId});
          if(!room) {
            throw new Error('no such room maddafakka!');
          }
          const producer = this.gathering?.getClient(reqParams.clientId).producers.get(reqParams.producerId);
          if(!producer){
            throw new Error('no such producer found!');
          }
          if(reqParams.mediaKind === 'video'){
            room.mainProducers.video = producer;
          } else if(reqParams.mediaKind === 'audio'){
            room.mainProducers.audio = producer;
          }
          this.gathering?.broadCastGatheringState(undefined, 'mainProducer assigned to a room');
          response = createResponse('assignMainProducerToRoom', msg.id, { 
            wasSuccess: true,
          });
        } catch(e){
          response = createResponse('assignMainProducerToRoom', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to assign producer to room!! Now cry!'),
          });
        }
        this.send(response);
        break;
      }
      case 'createProducer': {
        // A producer on server side represents a client producing media and sending it to the server.
        let response: ResponseTo<'createProducer'>;
        try {
          if(!this.sendTransport){
            throw Error('sendTransport is undefined. Need a sendtransport to produce');
          } else if(this.sendTransport.id !== msg.data.transportId){
            throw Error('the provided transporId didnt match the id of the sendTransport');
          }
          const {kind, rtpParameters, producerInfo} = msg.data;
          const appData = { producerInfo };
          const producer = await this.sendTransport.produce({ kind, rtpParameters, appData});
          producer.on('transportclose', () => {
            console.log(`transport for producer ${producer.id} was closed`);
            this.producers.delete(producer.id);
            this.send(createMessage('notifyCloseEvent', {
              objectType: 'producer',
              objectId: producer.id,
            }));
            this.onClientStateUpdated('transport for a producer closed');
          });
          this.producers.set(producer.id, producer); 
          // if(this.role === 'admin'){
          //   this.gathering?.broadCastGatheringState();
          // }
          this.onClientStateUpdated('producer created');
          response = createResponse('createProducer', msg.id, { wasSuccess: true, data: {producerId: producer.id}});
        } catch(e){
          const err = extractMessageFromCatch(e);
          response = createResponse('createProducer', msg.id, {
            wasSuccess: false,
            message: err,
          });
        }
        this.send(response);
        break;
      }
      case 'createConsumer': {
        let response:ResponseTo<'createConsumer'>;
        try {
          if(!this.room){
            throw Error('not in a room. Duuude, thats required to create consumer');
          }
          if(!this.gathering){
            throw Error('not in a gathering! No bueno, sir!');
          }
          if(!this.rtpCapabilities){
            throw Error('rtpCapabilities of peer unknown. Provide them before requesting to consume');
          }
          const requestedProducerId = msg.data.producerId;
          const canConsume = this.gathering.router.canConsume({producerId: requestedProducerId, rtpCapabilities: this.rtpCapabilities});
          if( !canConsume){
            throw Error('Client is not capable of consuming the producer according to provided rtpCapabilities');
          }
          const producer = this.room.producers.get(requestedProducerId);
          if(!producer){
            throw Error('no producer with that id found in current room!');
          }

          if(!this.receiveTransport){
            throw Error('A transport is required to create a consumer');
          }

          const consumer = await this.receiveTransport.consume({
            producerId: producer.id,
            rtpCapabilities: this.rtpCapabilities,
            paused: true,
          });

          this.consumers.set(consumer.id, consumer);

          consumer.on('transportclose', () => {
            console.log(`---consumer transport close--- client: ${this.id} consumer_id: ${consumer.id}`);
            this.send(createMessage('notifyCloseEvent', {
              objectType: 'consumer',
              objectId: consumer.id,
            }));
            this.consumers.delete(consumer.id);
            this.onClientStateUpdated('transport for a consumer closed');
          });

          consumer.on('producerclose', () => {
            console.log(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
            this.send(createMessage('notifyCloseEvent', {
              objectType: 'consumer',
              objectId: consumer.id
            }));
            this.consumers.delete(consumer.id);
          });

          consumer.on('producerpause', () => {
            console.log('producer was paused! Handler NOT IMPLEMENTED YET!');
          });
          consumer.on('producerresume', () => {
            console.log('producer was resumed! Handler NOT IMPLEMENTED YET!');
          });
          
          const {id, producerId, kind, rtpParameters} = consumer;

          response = createResponse('createConsumer', msg.id, {
            wasSuccess: true,
            data: {
              id, producerId, kind, rtpParameters 
            }
          });
        } catch (e) {
          response = createResponse('createConsumer', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to create consumer'),
          });
        }
        this.send(response);
        break; 
      }
      case 'notifyPauseResumeRequest': {
        console.log('received notify Pause resume:', msg.data);
        let response: ResponseTo<'notifyPauseResumeRequest'>;
        try {
          let prodcon: soupTypes.Producer | soupTypes.Consumer | undefined;
          if(msg.data.objectType == 'consumer') {
            prodcon = this.consumers.get(msg.data.objectId);
          } else {
            prodcon = this.producers.get(msg.data.objectId);
          }
          if(!prodcon){
            throw new Error('no producer/consumer found');
          }
          if(msg.data.wasPaused){
            await prodcon.pause();
          } else {
            await prodcon.resume();
          }
          response = createResponse('notifyPauseResumeRequest', msg.id, {
            wasSuccess: true,
          });
        } catch (e) {
          response = createResponse('notifyPauseResumeRequest', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to change playing state of producer/consumer')
          });
        }
        this.send(response);
        break; 
      }
      case 'setCustomClientProperties': {
        let response: ResponseTo<'setCustomClientProperties'>;
        try {

          this.setCustomProperties(msg.data);
          // this.send(createSuccessResponse(msg));
          response = createResponse('setCustomClientProperties', msg.id, { wasSuccess: true });
        } catch (e) {
          response = createResponse('setCustomClientProperties', msg.id, { wasSuccess: false, message: extractMessageFromCatch(e, 'failed to set custom props on client')});
          // const failString = extractMessageFromCatch(e, 'failed to set custom props on client');
          // this.send(createFailResponse(msg, failString));
        }
        this.send(response);
        break;
      }
      default:
        break;
    }
  };

  get clientState(){
    const producers: ClientState['producers'] = {};
    for(const [_, producer] of this.producers){
      
      producers[producer.id] = {
        producerId: producer.id,
        kind: producer.kind,
      };
      if(producer.appData.producerInfo){
        producers[producer.id].producerInfo = producer.appData.producerInfo;
      }
    }
    const state: ClientState = {
      clientId: this.id,
      username: this.userName,
      customProperties: this.customProperties,
      connected: this.connected,
      role: this.role,
      producers: producers,
    };
    if(this.gathering){
      state.gatheringId = this.gathering.id;
    }
    if(this.room){
      state.roomId = this.room.id;
    }
    return state;
  }

  // Not sure yet if we can rely on always broadcasting to room if inside one and send to self if not.
  // Also, how about gatherings? Do we sometimes want to broadcast clientstate changes on gathering level?
  onClientStateUpdated(reason?: string) {
    if(!reason) reason = 'reason not specified';
    if(this.room){
      this.room.broadcastRoomState(reason);
    } else {
      this.send(createMessage('clientStateUpdated', {
        newState: this.clientState, 
        reason}));
    }
  }

  setCustomProperties (props : Record<string, unknown>)  {
    for(const [key, prop] of Object.entries(props)) {
      this.customProperties[key] = prop;
    }
    this.onClientStateUpdated('a client changed custom properties');
  }

  private leaveCurrentRoom(): string;
  private leaveCurrentRoom(throwIfNonExistent: true): string;
  private leaveCurrentRoom(throwIfNonExistent: false): string | undefined; 
  private leaveCurrentRoom(throwIfNonExistent = true){
    if(!this.room){
      if(throwIfNonExistent){
        throw Error('not in a room. thus cant leave one');
      }
      return;
    }
    this.closeAndNotifyAllConsumers();
    const roomId = this.room.id;
    this.room.removeClient(this);
    this.setRoom(undefined);
    return roomId;
  }

  private closeAndNotifyAllConsumers = () => {
    const consumerArray = Array.from(this.consumers.entries());
    for(const [consumerKey, consumer] of consumerArray){
      consumer.close();
      const closeConsumerMsg = createMessage('notifyCloseEvent', {
        objectType: 'consumer',
        objectId: consumerKey,
      });
      this.send(closeConsumerMsg);
      this.consumers.delete(consumerKey);      
    }
  };

  private closeAndNotifyConsumer(consumerId: string){
    const consumer = this.consumers.get(consumerId);
    if(!consumer){
      throw Error('no consumer with that id. cant close it');
    }
    consumer.close();
    this.send(createMessage('notifyCloseEvent', {
      objectType: 'consumer',
      objectId: consumerId,
    }));

    this.consumers.delete(consumerId);
  }

  // This function currently assumes we want to destroy everything related to the client connection. I.E not handle reconnect.
  // TODO: Decide if we want to have some recover functionality for reconnecting sockets.
  // If so, we should probably have one disconnect function and one destroy function, to handle thos two different scenarios.
  onDisconnected(){
    this.connected = false;
    this.room?.removeClient(this, true);
    this.gathering?.removeClient(this);
   
    // mediasoup should handle closing and notifying producers and consumers when their respective transports are closed. So we wont close producers or consumers ourselves
    this.sendTransport?.close();
    this.receiveTransport?.close();
    // this.ws = undefined;
  }

  onReconnected() {
    this.connected = true;
  }

  send(msg: SocketMessage<UnknownMessageType>) {
    console.log(`gonna send message to client ${this.id}:`, msg);
    if(!this.connected){
      console.error('Tried to send to a closed socket. NOOO GOOD!');
      return;
    }
    this.ws.send(msg);
  }

  sendRequest<T extends RequestSubjects>(msg: SocketMessage<Request<T>>, timeoutMillis?:number) {
    console.log(`gonna send request to client ${this.id}:`, msg);
    if(!this.connected){
      console.error('tried to send request to a closed socket. NOOO GOOD!');
      return Promise.reject();
    }
    return this.ws.sendRequest(msg, timeoutMillis);
  }

  async createWebRtcTransport(direction: 'send' | 'receive'){
    if(!this.gathering) {
      throw Error('must be in a gathering in order to create transport');
    }
    const transport = await this.gathering.createWebRtcTransport();
    if(!transport){
      throw new Error('failed to create transport!!');
    }
    transport.addListener('routerclose', () => {
      this.send(createMessage('notifyCloseEvent', {
        objectType: 'transport',
        objectId: transport.id,
      }));
    });
    if(direction == 'receive'){
      this.receiveTransport = transport;
      this.receiveTransport.addListener('routerclose', ()=> {
        this.receiveTransport = undefined;
      });
    } else {
      this.sendTransport = transport;
      this.sendTransport.addListener('routerclose',()=> {
        this.sendTransport = undefined;
      });
    }
    const { id, iceParameters, dtlsParameters } = transport;
    const iceCandidates = <soupClientTypes.IceCandidate[]>transport.iceCandidates;
    const transportOptions: soupClientTypes.TransportOptions = {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    };

    return transportOptions;

  }


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