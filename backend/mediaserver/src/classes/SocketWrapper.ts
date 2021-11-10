// import EventEmitter from 'events';
import uWebsocket from 'uWebSockets.js';
import { TypedEmitter } from 'tiny-typed-emitter';

export type InternalSocketType = uWebsocket.WebSocket;
// type InternalMessageType = uWebsocket.RecognizedString;
export type InternalMessageType = ArrayBuffer;

interface SocketWrapperEvents {
  /**
   * Triggered when the socket received a message
   * @event
   */
  message: (msg: SocketMessage<UnknownMessageType>) => void;
}


/**
 * This class is an abstraction layer on top of the websocket implementation.
 * My hope is that this will make it easier to maintain if we have to change to another websocket library 
 * 
 * @emits message event that is triggered when a message is received.
 */
export default class SocketWrapper extends TypedEmitter<SocketWrapperEvents>{
  private socket: InternalSocketType;
  constructor(socket: InternalSocketType){
    super();
    this.socket = socket;
  }

  /**
   *  
   * 
   * @param msg the message in the form and type provided by the underlying websocket implemention
   * devent that is triggered when the underlying socket implementation receives a message.
   */
  incomingMessage(msg: InternalMessageType){
    try {
      // TODO: I reaaaaally think we need some data validation here!!!!
      const asString = Buffer.from(msg).toString();
      const socketMsg: SocketMessage<UnknownMessageType> = JSON.parse(asString) as SocketMessage<UnknownMessageType>;
      if(!socketMsg){
        console.error('fuck. Couldnt convert incoming data to messageType');
        return;
      }
      this.emit('message', socketMsg);
      return;
    } catch (e) {
      // console.log(e);
    }
    console.log('couldnt parse incoming message into js object. IGNORING it!');

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