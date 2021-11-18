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
    switch (msg.type) {
      case 'setRtpCapabilities':
        this.rtpCapabilities = msg.data;
        break;
      case 'getRouterRtpCapabilities': {
        // TODO: Here we should send different stuff depending on stuff
        const response: UknownResponse = {
          // type: 'rtpCapabilitiesResponse',
          isResponse: true,
          // wasSuccess: true,
          // data: { codecs: []} 
        };
        if(!this.room){
          console.warn('Client requested router capabilities without being in a room');
          return;
        }
        const roomRtpCaps = this.room.getRtpCapabilities();
        response.data;

        this.send(response);
        break;
      }
      case 'joinRoom': {
        // console.log('request to join room:', msg.data.id);
        const response: SocketMessage<JoinRoomResponse> = {
          type: 'joinRoomResponse',
          isResponse: true,
          wasSuccess: false,
        };
        if(!this.gathering){
          console.warn('Client requested to join room without being inside a gathering');
          response.message = 'not in a gathering. Cant join a room without being in a gathering';
          this.send(response);
          return;
        }
        const roomId = msg.data.id;
        const foundRoom = this.gathering.getRoom(roomId);
        if(foundRoom){
          const ok = foundRoom.addClient(this);
          if(ok){
            this.room = foundRoom;
            response.wasSuccess = true;
            response.message = 'succesfully joined room';
            this.send(response);
            return;
          }
        }
        console.warn('Failed to join room!!');
        this.send(response);

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