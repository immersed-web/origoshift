import { v4 as uuidv4 } from 'uuid';
import SocketWrapper from './SocketWrapper';
// import uWebsocket from 'uWebSockets.js';

interface constructionParams {
  id?: string, ws: SocketWrapper
}
export default class Client {
  id: string;
  ws: SocketWrapper;

  constructor({id = uuidv4(), ws }: constructionParams){
    // if(!id){
    //   this.id = uuidv4();
    // }else {
    //   this.id = id;
    // }
    this.id = id;
    this.ws = ws;
  }

}