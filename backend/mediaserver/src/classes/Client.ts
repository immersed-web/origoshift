import { randomUUID } from 'crypto';
import SocketWrapper from './SocketWrapper';
import {types as soupTypes} from 'mediasoup';
import {types as soupClientTypes} from 'mediasoup-client';
import { ClientState, UserData, UserRole } from 'shared-types/CustomTypes';
import { createMessage, createResponse, ResponseTo, SocketMessage, UnknownMessageType } from 'shared-types/MessageTypes';
import { extractMessageFromCatch } from 'shared-modules/utilFns';

import Room from './Room';
import Gathering from './Gathering';

interface constructionParams {
  id?: string,
  ws: SocketWrapper,
  userData?: UserData,
}
/**
 * This class represents a client in the backend. This class is also responsible for the communication with the "actual" client (i.e. the frontend).
 */
export default class Client {
  id: string;
  private ws: SocketWrapper;

  nickName = 'unnamed';
  connected = true;

  role: UserRole = 'guest';
  userData?: UserData;

  rtpCapabilities?: soupTypes.RtpCapabilities;
  receiveTransport?: soupTypes.WebRtcTransport;
  sendTransport?: soupTypes.WebRtcTransport;
  consumers: Map<string, soupTypes.Consumer> = new Map();
  producers: Map<string, soupTypes.Producer> = new Map();

  gathering?: Gathering;
  room? : Room;

  constructor({id = randomUUID(), ws, userData}: constructionParams){
    this.id = id;
    this.ws = ws;
    if(userData){
      this.userData = userData;
      this.nickName = userData.username;
    }


    ws.registerReceivedMessageCallback((msg) => {
      console.log('client received message:', msg);
      this.handleReceivedMsg(msg);
    });
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
      return;
    }
    if(!msg.id){
      console.error('no id in received request!!!');
      return;
    }
    // console.log('received Request!!');
    switch (msg.subject) {
      case 'setName': {
        this.nickName = msg.data.name;
        const response = createResponse('setName', msg.id, {
          wasSuccess: true,
        });
        this.send(response);
        break;
      }
      case 'getClientState': {
        const response = createResponse('getClientState', msg.id, { wasSuccess: true, data: this.clientState});
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
        console.log('client want routerRtpCaps. They are: ', roomRtpCaps);
        const response = createResponse('getRouterRtpCapabilities', msg.id, {
          wasSuccess: true,
          data: roomRtpCaps,
        });
        this.send(response);
        break;
      }
      case 'createGathering': {
        const gathering = await Gathering.createGathering(undefined, msg.data.gatheringName);
        this.gathering = gathering;
        const response = createResponse('createGathering', msg.id, {
          data: {
            gatheringId: gathering.id
          },
          wasSuccess: true,
        });
        this.send(response);
        break;
      }
      case 'joinGathering': {
        if(this.gathering){
          this.gathering.removeClient(this);
          this.gathering = undefined;
        }
        // TODO: Implement logic here (or elsewhere?) that checks whether the user is authorized to join the gathering or not
        // console.log('request to join gathering', msg.data);
        // const gathering = Gathering.gatherings.get(msg.data.id);
        const gathering = Gathering.getGathering(msg.data.gatheringId);
        if(!gathering){
          console.warn('Cant join that gathering. Does not exist');
          return;
        }
        gathering.addClient(this);
        this.gathering = gathering;
        const response = createResponse('joinGathering', msg.id, {
          wasSuccess: true,
        });
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
          this.gathering = undefined;
        } catch(e){
          response.wasSuccess = false;
          const msg = extractMessageFromCatch(e, 'failed to leave gathering');
          response.message = msg;
        }
        this.send(response);
        break; 
      }
      case 'getGatheringState': {
        if(!this.gathering){
          console.warn('cant list rooms if isnt in a gathering');
          return;
        }
        const gatheringState = this.gathering.getGatheringState();
        const response = createResponse('getGatheringState', msg.id, {
          wasSuccess: true,
          data: gatheringState
        });
        this.send(response);
        break;
      }
      case 'createRoom': {
        if(!this.gathering){
          console.error('no gathering to put the created room in!!!');
          return;
        }
        const room = this.gathering.createRoom();
        // this.room = room;
        const response = createResponse('createRoom', msg.id, {
          wasSuccess: true,
          data: {
            roomId: room.id
          }
        });
        this.send(response);
        break;
      }

      case 'joinRoom': {
        this.leaveCurrentRoom(false);
        //default to fail message
        const response = createResponse('joinRoom', msg.id, { wasSuccess: false, message: 'failed to join room'});
        try{

          if(!this.gathering){
            throw Error('not in a gathering. Can not join a room without being in a gathering');
          }
          const roomId = msg.data.roomId;
          const foundRoom = this.gathering.getRoom(roomId);
          if(!foundRoom){
            throw Error('no such room in gathering');
          }
          foundRoom.addClient(this);
          this.room = foundRoom;
          response.wasSuccess = true;
          response.message = 'succesfully joined room';
        } catch(e){
          response.message = extractMessageFromCatch(e, `failed to joinRoom: ${msg.data.roomId}`);
          response.wasSuccess = false;
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
        let chosendTransport;
        if(transportId === this.receiveTransport?.id){
          chosendTransport = this.receiveTransport;
        } else{
          chosendTransport = this.sendTransport;
        }
        try {
          await chosendTransport?.connect({dtlsParameters});
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
      case 'notifyCloseEvent': {
        let response: ResponseTo<'notifyCloseEvent'>;

        try{

          switch (msg.data.objectType) {
            case 'consumer': {
              this.closeConsumer(msg.data.objectId);
              response = createResponse('notifyCloseEvent', msg.id, {wasSuccess: true});
              break;
            }
            default:{
              throw Error(`notifyCloseHandler not implemented for objectType: ${msg.data.objectType}`);
            }
          }
        } catch(e){
          response = createResponse('notifyCloseEvent', msg.id, {
            wasSuccess: false,
            message: extractMessageFromCatch(e, 'failed to close the server side object'),
          });
        }
        this.send(response);
        break;
      }
      case 'createProducer': {
        // A producer on server side represents a client producing media and sending it to the server.
        try {
          if(!this.sendTransport){
            throw Error('sendTransport is undefined. Need a sendtransport to produce');
          } else if(this.sendTransport.id !== msg.data.transportId){
            throw Error('the provided transporId didnt math the id of the sendTransport');
          }
          const {kind, rtpParameters, transportId: id} = msg.data;
          // TODO: create this in paused state!
          const producer = await this.sendTransport.produce({id, kind, rtpParameters});
          this.producers.set(producer.id, producer); 
          const response = createResponse('createProducer', msg.id, { wasSuccess: true, data: {producerId: producer.id}});
          this.send(response);
        } catch(e){
          const err = extractMessageFromCatch(e);
          const response = createResponse('createProducer', msg.id, {
            wasSuccess: false,
            message: err,
          });
          this.send(response);
        }
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

          // TODO: The docs recommend not creating consumer in unpaused state. Address this!!!
          // https://mediasoup.org/documentation/v3/mediasoup/api/#transport-consume
          const consumer = await this.receiveTransport.consume({
            producerId: producer.id,
            rtpCapabilities: this.rtpCapabilities,
            paused: true,
          });

          this.consumers.set(consumer.id, consumer);

          consumer.on('transportclose', () => {
            console.log(`---consumer transport close--- client: ${this.id} consumer_id: ${consumer.id}`);
            this.consumers.delete(consumer.id);
          });

          consumer.on('producerclose', () => {
            console.log(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
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
      default:
        break;
    }
  };

  get clientState(){
    const state: ClientState = {
      // clientId: this.id,
    };
    if(this.gathering){
      state.gatheringId = this.gathering.id;
    }
    if(this.room){
      state.roomId = this.room.id;
    }
    return state;
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
    this.closeAllConsumers();
    const roomId = this.room.id;
    this.room.removeClient(this);
    this.room = undefined;
    return roomId;
  }

  private closeAllConsumers = () => {
    const arrayFromConsumerMap = Array.from(this.consumers.entries());
    for(const [consumerKey, consumer] of arrayFromConsumerMap){
      consumer.close();
      const closeConsumerMsg = createMessage('notifyCloseEvent', {
        objectType: 'consumer',
        objectId: consumerKey,
      });
      this.send(closeConsumerMsg);
      this.consumers.delete(consumerKey);      
    }
  };

  private closeConsumer(consumerId: string){
    const consumer = this.consumers.get(consumerId);
    if(!consumer){
      throw Error('client has no consumer with that id. cant close it');
    }
    consumer.close();

    this.consumers.delete(consumerId);
  }

  onDisconnected(){
    this.connected = false;
    // this.ws = undefined;
    this.room?.removeClient(this);
    this.gathering?.removeClient(this);
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

  async createWebRtcTransport(direction: 'send' | 'receive'){
    if(!this.gathering) {
      throw Error('must be in a gathering in order to create transport');
    }
    const transport = await this.gathering.createWebRtcTransport();
    if(direction == 'receive'){
      this.receiveTransport = transport;
    } else {
      this.sendTransport = transport;
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

  // roomInfoUpdated(newRoomState: RoomState){
  //   console.log('roomState updated', newRoomState);
  //   const roomStateUpdate = createRequest('roomStateUpdated', newRoomState);
  //   this.send(roomStateUpdate);
  // }

  // /**
  //  * I would prefer to not need this function. but uWebsockets is not attaching incoming messages to the socket object itself, but rather the server.
  //  * Thus we have to propagate the message "down" to the socketWrapper
  //  */
  // EDIT: I made an ugly hack so we instead can access the socket instance directly from index.ts
  // (typescript only checks access of private members on build so we ignore that and access it directly in js)
  // incomingMessage(msg: InternalMessageType){
  //   this.ws.incomingMessage(msg);
  // }
}