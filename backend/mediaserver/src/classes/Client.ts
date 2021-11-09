import { v4 as uuidv4 } from 'uuid';
import SocketWrapper, { InternalMessageType } from './SocketWrapper';
import {types as soup} from 'mediasoup';
import {types as soupClient} from 'mediasoup-client';
import Room from './Room';

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

  rtpCapabilities?: soupClient.RtpCapabilities;
  receiveTransport?: soup.WebRtcTransport;
  consumers: Map<string, soup.Consumer> = new Map();
  producers: Map<string, soup.Producer> = new Map();

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
      switch (msg.type) {
      case 'setRtpCapabilities':
        this.rtpCapabilities = msg.data;
        break;
      case 'getRouterRtpCapabilities':
        if(!this.room){
          console.warn('Client requested router capabilities without being in a room');
          return;
        }
        this.room.getRtpCapabilities();
        break;
      default:
        break;
      }
      // ws.send(msg);
    });
  }

  /**
   * I would prefer to not need this function. but uWebsockets is not attaching incoming messages to the socket object itself, but rather the server.
   * Thus we have to propagate the message "down" to the socketWrapper
   */
  incomingMessage(msg: InternalMessageType){
    this.ws.triggerMessage(msg);
  }

}