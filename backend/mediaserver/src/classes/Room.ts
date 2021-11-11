import {types as soup} from 'mediasoup';
import {v4 as uuidv4} from 'uuid';
import { MediasoupConfig } from '../mediasoupConfig';
import Client from './Client';
export default class Room {
  router: soup.Router;
  id: string;
  clients: Map<string, Client> = new Map();

  static async createRoom(id: string = uuidv4(), worker: soup.Worker, config?: MediasoupConfig): Promise<Room> {
    const routerOptions: soup.RouterOptions = {};
    if(config?.router.mediaCodecs){
      routerOptions.mediaCodecs = config.router.mediaCodecs;
    }
    const router = await worker.createRouter(routerOptions);
    const createdRoom = new Room(id, router);
      
    return createdRoom;
  }

  constructor(id: string, router: soup.Router) {
    this.router = router;
    this.id = id;
  }

  getRtpCapabilities(): soup.RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  addClient(client: Client){
    // TODO: Possibly handle shared state so clients know about each other
    this.clients.set(client.id, client);

    // TODO: Actually verify that the client was sucessfully added and only then return true
    return true;
  }
}