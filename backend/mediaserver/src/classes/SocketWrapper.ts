// import EventEmitter from 'events';
import uWebsocket from 'uWebSockets.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { AnyRequest, AnyResponse, RequestSubjects, ResponseTo, SocketMessage, UnknownMessageType } from 'shared-types/MessageTypes';
// import { AnyRequest, AnyResponse, RequestSubjects, ResponseTo, SocketMessage, UnknownMessageType } from '../../../../types/MessageTypes';

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

const requestTimeout = 10000;
type RequestResolver = (msg:AnyResponse) => void;

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


  private pendingRequests = new Map<number, RequestResolver>();

  /**
   * @param msg the message in the form and type provided by the underlying websocket implemention
   * event that is triggered when the underlying socket implementation receives a message.
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
      if('isResponse' in socketMsg){
        try {
          const resolve = this.pendingRequests.get(socketMsg.id);
          if(resolve){resolve(socketMsg);}

        }catch(e){
          console.error(e);
        }
      }else{ 
        this.emit('message', socketMsg);
        return;
      }
    } catch (e) {
      // console.log(e);
    }
    console.warn('couldnt parse incoming message into js object. IGNORING it!');

  }

  sendRequest = async <T extends RequestSubjects>(msg: SocketMessage<AnyRequest>): Promise<ResponseTo<T>> => {
    msg.id = Date.now(); // Questionable if we should set the id here...
    const id = msg.id;
    const msgString = JSON.stringify(msg);
    this.socket.send(msgString);
    const promise: Promise<AnyResponse> = new Promise((resolve, reject) => {
      this.pendingRequests.set(id, resolve);
      setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(`request timed out: ${id}`);
      }, requestTimeout);
    });
    console.log(msg);
    // type TheResponseType = ResponseTo<>
    // type asdasd = Pick<AnyRequest, 'subject'>['subject']
    // type Resp = ResponseTo<'joinRoom'>

    return promise as Promise<ResponseTo<T>>;
  };
  
  send(msg: SocketMessage<UnknownMessageType>){
    // console.log('raw SocketMessage:', msg);
    const str = JSON.stringify(msg);
    // console.log('gonna send back:', str);
    const ok = this.socket.send(str); 
    // console.log('sending backpressure was ok?: ', ok);
    return ok;
  }
}