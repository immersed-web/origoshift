// import EventEmitter from 'events';
import uWebsocket from 'uWebSockets.js';
import { TypedEmitter } from 'tiny-typed-emitter';

export type InternalSocketType = uWebsocket.WebSocket;
// type InternalMessageType = uWebsocket.RecognizedString;
export type InternalMessageType = ArrayBuffer;

interface SocketWrapperEvents {
  /**
   * Triggered when the underlying socket received a message
   * @event
   */
  message: (msg: SocketMessage<UnknownMessageType>) => void;
}


// const textDecoder = new TextDecoder();
export default class SocketWrapper extends TypedEmitter<SocketWrapperEvents>{
  private socket: InternalSocketType;
  constructor(socket: InternalSocketType){
    super();
    this.socket = socket;
  }

  /**
   * event that is triggered when the underlying socket implementation receives a message.
   * 
   * @param msg the message in the form and type provided by the underlying websocket implemention
   * @emits 'message' an object that implements our high level message interface 
   */
  triggerMessage(msg: InternalMessageType){
    // console.log('onMessage with:', msg);
    // const str = textDecoder.decode(msg);
    // console.log('textdecoded incoming msg:', str);
    const asString = Buffer.from(msg).toString();
    // const asString = 'bajs';
    const socketMsg: SocketMessage<UnknownMessageType> = JSON.parse(asString) as SocketMessage<UnknownMessageType>;
    if(!socketMsg){
      console.error('fuck. Couldnt convert incoming data to messageType');
      return;
    }

    // TODO: I reaaaaally think we need some data validation here!!!!
    this.emit('message', socketMsg);
  }
  
  send(msg: SocketMessage<UnknownMessageType>){
    // console.log('raw SocketMessage:', msg);
    const str = JSON.stringify(msg);
    // console.log('gonna send back:', str);
    const ok = this.socket.send(str); 
    // console.log('sending backpressure was ok?: ', ok);
    return ok;
  }
}