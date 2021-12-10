import { randomUUID } from 'crypto';
import SocketWrapper from './SocketWrapper';
import {types as soup} from 'mediasoup';
// import {types as soupClient} from 'mediasoup-client';
// import { createResponse, SocketMessage, UnknownMessageType } from '@sharedTypes/MessageTypes';
// import { UserRole } from '@sharedTypes/CustomTypes';
import { createResponse, SocketMessage, UnknownMessageType } from '../../../../types/MessageTypes';
import { UserRole } from '../../../../types/CustomTypes';
import Room from './Room';
import Gathering from './Gathering';

interface constructionParams {
  id?: string, ws: SocketWrapper
}
/**
 * This class represents a client in the backend. This class is also responsible for the communication with the "actual" client (i.e. the frontend).
 */
export default class Client {
  id: string;
  private ws: SocketWrapper;

  name = 'unnamed';

  role: UserRole = 'anonymous';

  rtpCapabilities?: soup.RtpCapabilities;
  receiveTransport?: soup.WebRtcTransport;
  consumers: Map<string, soup.Consumer> = new Map();
  producers: Map<string, soup.Producer> = new Map();

  gathering?: Gathering;
  room? : Room;

  constructor({id = randomUUID(), ws }: constructionParams){
    // if(!id){
    //   this.id = uuidv4();
    // }else {
    //   this.id = id;
    // }
    this.id = id;
    this.ws = ws;


    ws.on('message', (msg) => {
      console.log('client received message:', msg);
      this.handleReceivedMsg(msg);
    });
  }

  private handleReceivedMsg = async (msg: SocketMessage<UnknownMessageType>) => {
    if('isResponse' in msg){
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
        this.name = msg.data.name;
        const response = createResponse<'setName'>('setName', msg.id, {
          wasSuccess: true,
          message: 'name updated!'
        });
        this.send(response);
        break;
      }
      case 'setRtpCapabilities': {
        this.rtpCapabilities = msg.data;
        const response = createResponse<'setRtpCapabilities'>('setRtpCapabilities', msg.id, {
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
        if(!this.room){
          console.warn('Client requested router capabilities without being in a room');
          const response = createResponse<'getRouterRtpCapabilities'>('getRouterRtpCapabilities', msg.id, {
            wasSuccess: false,
            message: 'not in a room. Must be in room to request RtpCapabilities',
          });
          this.send(response);
          return;
        }
        const roomRtpCaps = this.room.getRtpCapabilities();
        console.log('clientwant routerRtpCaps. They are: ', roomRtpCaps);
        const response = createResponse<'getRouterRtpCapabilities'>('getRouterRtpCapabilities', msg.id, {
          wasSuccess: true,
          data: roomRtpCaps,
        });
        this.send(response);
        break;
      }
      case 'createGathering': {
        const gathering = await Gathering.createGathering(undefined, msg.data.gatheringName);
        this.gathering = gathering;
        const response = createResponse<'createGathering'>('createGathering', msg.id, {
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
        const response = createResponse<'joinGathering'>('joinGathering', msg.id, {
          wasSuccess: true,
        });
        this.send(response);
        break;
      }
      case 'getRooms': {
        if(!this.gathering){
          console.warn('cant list rooms if isnt in a gathering');
          return;
        }
        const rooms = this.gathering.listRooms();
        const response = createResponse<'getRooms'>('getRooms', msg.id, {
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
        const response = createResponse<'createRoom'>('createRoom', msg.id, {
          wasSuccess: true,
          data: {
            roomId: room.id
          }
        });
        this.send(response);
        break;
      }
      case 'joinRoom': {
        const response = createResponse<'joinRoom'>('joinRoom', msg.id, { wasSuccess: false, message: 'not in a gathering. Can not join a room without being in a gathering'});
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

  // roomStateUpdated(newRoomState: RoomState){
  //   console.log('roomState updated', newRoomState);
  //   const msg: RoomStateUpdate = {
  //     type: 'dataMessage',
  //     subject: 'roomState',
  //     responseNeeded: false,
  //     data: newRoomState,
  //   };
  //   this.send(msg);
  // }

  // /**
  //  * I would prefer to not need this function. but uWebsockets is not attaching incoming messages to the socket object itself, but rather the server.
  //  * Thus we have to propagate the message "down" to the socketWrapper
  //  */
  // incomingMessage(msg: InternalMessageType){
  //   this.ws.incomingMessage(msg);
  // }
}