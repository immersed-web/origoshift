import { v4 as uuidv4 } from 'uuid';
import SocketWrapper from './SocketWrapper';
import {types as soup} from 'mediasoup';
// import {types as soupClient} from 'mediasoup-client';
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

  role: ClientRole = 'anonymous';

  rtpCapabilities?: soup.RtpCapabilities;
  receiveTransport?: soup.WebRtcTransport;
  consumers: Map<string, soup.Consumer> = new Map();
  producers: Map<string, soup.Producer> = new Map();

  gathering?: Gathering;
  room? : Room;

  constructor({id = uuidv4(), ws }: constructionParams){
    // if(!id){
    //   this.id = uuidv4();
    // }else {
    //   this.id = id;
    // }
    this.id = id;
    this.ws = ws;


    ws.on('message', (msg) => {
      console.log('client received mesage:', msg);
      this.handleReceivedMsg(msg);
    });
  }

  private handleReceivedMsg = (msg: SocketMessage<UnknownMessageType>) => {
    if(msg.isResponse){
      //TODO: Implement some promise based way to handle acks/req-responses
      console.log('received a response msg: ', msg);
      return;
    }
    switch (msg.subject) {
      case 'setRtpCapabilities':
        this.rtpCapabilities = msg.data;
        break;
      case 'getRouterRtpCapabilities': {
        const response = {
          type: 'dataResponse',
          subject: 'getRouterRtpCapabilities',
          isResponse: true,
        } as UnfinishedResponse<GetRouterRtpCapabilitiesResponse>;
        if(!this.room){
          console.warn('Client requested router capabilities without being in a room');
          response.wasSuccess = false;
          response.message = 'not in a room. Must be in room to request RtpCapabilities';
          response.wasSuccess === false ? this.send(response): null;
          return;
        }
        const roomRtpCaps = this.room.getRtpCapabilities();
        response.wasSuccess = true;
        if(response.wasSuccess){
          response.data = roomRtpCaps;
          this.send(response);
        }
        break;
      }
      case 'joinRoom': {
        const response = {
          isResponse: true,
          subject: 'joinRoom',
          type: 'actionResponse',
          wasSuccess: false,
        } as UnfinishedResponse<JoinRoomResponse>;

        if(!this.gathering){
          console.warn('Client requested to join room without being inside a gathering');
          response.message = 'not in a gathering. Cant join a room without being in a gathering';
        }else {
          const roomId = msg.data.id;
          const foundRoom = this.gathering.getRoom(roomId);
          if(!foundRoom){
            response.message = 'no such room in gathering';
          } else {
            const ok = foundRoom.addClient(this);
            if(!ok){
              response.message = 'failed to add client to the room';
            }else {
              this.room = foundRoom;
              response.wasSuccess = true;
              response.message = 'succesfully joined room';
              if(response.wasSuccess){
                response.data = {id: foundRoom.id};
              } 
            }
          }
        }
        if(response.wasSuccess !== undefined){
          this.send(response);
        }else {
          console.error('shouldn reach a point without a valid respone message built');
        }

        break;
      }
      case 'joinGathering': {
        // TODO: Implement logic here (or elsewhere?) that checks whether the user is authorized to join the gathering or not
        // console.log('request to join gathering', msg.data);
        // const gathering = Gathering.gatherings.get(msg.data.id);
        const gathering = Gathering.getGathering(msg.data.id);
        if(!gathering){
          console.warn('Cant join that gathering. Does not exist');
          return;
        }
        this.gathering = gathering;
        break;
      }
      default:
        break;
    }
  };

  private send(msg: SocketMessage<UnknownMessageType>) {
    this.ws.send(msg);
  }
  

  // /**
  //  * I would prefer to not need this function. but uWebsockets is not attaching incoming messages to the socket object itself, but rather the server.
  //  * Thus we have to propagate the message "down" to the socketWrapper
  //  */
  // incomingMessage(msg: InternalMessageType){
  //   this.ws.incomingMessage(msg);
  // }

}