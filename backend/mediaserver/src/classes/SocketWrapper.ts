// import EventEmitter from 'events';
import uWebsocket from 'uWebSockets.js';
import { TypedEmitter } from 'tiny-typed-emitter';

type InternalSocketType = uWebsocket.WebSocket;

interface SocketWrapperEvents {
  message: (msg: SocketMessage<UnknownMessageType>) => void;
}


const textDecoder = new TextDecoder();
export default class SocketWrapper extends TypedEmitter<SocketWrapperEvents>{
  private socket: InternalSocketType;
  constructor(socket: InternalSocketType){
    super();
    this.socket = socket;
  }

  /**
   *  This function is responsible for converting from raw websocket data -> SocketMessage\<UnknownMessageType\>
   */
  onMessage(msg: ArrayBuffer ){
    console.log('onMessage with:', msg);
    const str = textDecoder.decode(msg);
    console.log('textdecoded incoming msg:', str);
    const socketMsg: SocketMessage<UnknownMessageType> = JSON.parse(str) as SocketMessage<UnknownMessageType>;

    // TODO: I reaaaaally think we need some data validation here!!!!
    this.emit('message', socketMsg);
  }
  
  send(msg: SocketMessage<UnknownMessageType>){
    console.log('raw SocketMessage:', msg);
    const str = JSON.stringify(msg);
    console.log('gonna send back:', str);
    const ok = this.socket.send(str); 
    console.log('sending backpressure was ok?: ', ok);
  }
}