import { randomUUID } from 'crypto';
import SocketWrapper from './SocketWrapper';
import {types as soup} from 'mediasoup';
// import {types as soupClient} from 'mediasoup-client';
import { RoomState, UserData, UserRole } from 'shared-types/CustomTypes';
import { createRequest, createResponse, SocketMessage, UnknownMessageType } from 'shared-types/MessageTypes';

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

  role: UserRole = 'anonymous';
  userData?: UserData;

  rtpCapabilities?: soup.RtpCapabilities;
  receiveTransport?: soup.WebRtcTransport;
  sendTransport?: soup.WebRtcTransport;
  consumers: Map<string, soup.Consumer> = new Map();
  producers: Map<string, soup.Producer> = new Map();

  gathering?: Gathering;
  room? : Room;

  constructor({id = randomUUID(), ws, userData}: constructionParams){
    // if(!id){
    //   this.id = uuidv4();
    // }else {
    //   this.id = id;
    // }
    this.id = id;
    this.ws = ws;
    if(userData){
      this.userData = userData;
      this.nickName = userData.username;
    }


    ws.on('message', (msg) => {
      console.log('client received message:', msg);
      this.handleReceivedMsg(msg);
    });
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
    console.log('received Request!!');
    switch (msg.subject) {
      case 'setName': {
        this.nickName = msg.data.name;
        const response = createResponse('setName', msg.id, {
          wasSuccess: true,
        });
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
        // TODO: Implement logic here (or elsewhere?) that checks whether the user is authorized to join the gathering or not
        // console.log('request to join gathering', msg.data);
        // const gathering = Gathering.gatherings.get(msg.data.id);
        const gathering = Gathering.getGathering(msg.data.gatheringId);
        if(!gathering){
          console.warn('Cant join that gathering. Does not exist');
          return;
        }
        this.gathering = gathering;
        const response = createResponse('joinGathering', msg.id, {
          wasSuccess: true,
        });
        this.send(response);
        break;
      }
      case 'getRoomsInGathering': {
        if(!this.gathering){
          console.warn('cant list rooms if isnt in a gathering');
          return;
        }
        const rooms = this.gathering.getRoomsInGathering();
        const response = createResponse('getRoomsInGathering', msg.id, {
          wasSuccess: true,
          data: rooms
        });
        this.send(response);
        break;
      }
      case 'createRoom': {
        if(!this.gathering){
          console.error('no gathering to put the created room in!!!');
          return;
        }
        const room = await Room.createRoom();
        this.room = room;
        this.gathering.addRoom(room);
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
        const response = createResponse('joinRoom', msg.id, { wasSuccess: false, message: 'not in a gathering. Can not join a room without being in a gathering'});
        if(!this.gathering){
          console.warn('Client requested to join room without being inside a gathering');
          this.send(response);
        }else {
          const roomId = msg.data.roomId;
          const foundRoom = this.gathering.getRoom(roomId);
          response.message = 'no such room in gathering';
          if(foundRoom){
            const ok = foundRoom.addClient(this);
            if(!ok){
              console.warn(`failed to add client to room ${foundRoom.id}`);
              response.message = 'failed to add client to the room';
            }else {// SUCCESS
              this.room = foundRoom;
              response.wasSuccess = true;
              response.message = 'succesfully joined room';
            }
          }
        }
        this.send(response);
        break;
      }
      default:
        break;
    }
  };

  private send(msg: SocketMessage<UnknownMessageType>) {
    this.ws.send(msg);
  }

  roomInfoUpdated(newRoomState: RoomState){
    console.log('roomState updated', newRoomState);
    const roomStateUpdate = createRequest('roomStateUpdated', newRoomState);
    this.send(roomStateUpdate);
  }

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