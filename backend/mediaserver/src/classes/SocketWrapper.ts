import uWebsocket from 'uWebSockets.js';

type SocketType = uWebsocket.WebSocket;

export default class SocketWrapper {
  private socket: SocketType;
  constructor(socket: SocketType){
    this.socket = socket;
  }

  onMessage(msg: ArrayBuffer | string){
    console.log('onMessage with:', msg);
  }
}