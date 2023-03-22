
import { Log } from 'debug-level';
import type { Camera as PrismaCamera } from 'database';
import type { CameraId } from 'schemas';
import {Venue, UserClient, SenderClient} from './InternalClasses';

const log = new Log('Camera');

process.env.DEBUG = 'Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);


export class Camera {
  constructor(prismaCamera: PrismaCamera, venue: Venue, sender?: SenderClient){
    this.prismaData = prismaCamera;
    this.venue = venue;
    this.clients = new Map();
    if(sender){
      this.setSender(sender);
    }
  }

  venue: Venue;
  sender?: SenderClient;
  get producers() {
    if(!this.sender) {
      return undefined;
    }
    this.sender.getPublicProducers();
  }
  clients: Venue['clients'];
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  prismaData: PrismaCamera;
  get cameraId(){
    return this.prismaData.cameraId as CameraId;
  }
  get name() {
    return this.prismaData.name;
  }
  setName(name: string) {
    this.prismaData.name = name;
  }

  getPublicState() {
    const { cameraId, name, clientIds, producers } = this;
    // const producers = this.sender?.getPublicProducers();
    return { cameraId, name, clientIds, producers };
  }

  /**
   * Add a client to the camera. This function also takes care of setting the clients currentCamera field.
   */
  addClient(client: UserClient){
    const cc = client.currentCamera;
    if(cc){
      cc.removeClient(client);
    }
    this.clients.set(client.connectionId, client);
    client._setCamera(this.cameraId);
  }

  removeClient(client: UserClient){
    const wasRemoved = this.clients.delete(client.connectionId);
    if(wasRemoved){
      client._setCamera();
    }
    return wasRemoved;
  }

  setSender(sender: SenderClient | undefined){
    if(!sender){
      this.sender?._setCamera(undefined);
      this.sender = undefined;
      return;
    }
    if(this.sender){
      throw Error('trying to set sender in camera when it was already set. This should not happen!');
    }
    this.sender = sender;
    sender._setCamera(this.cameraId);
  }

  // STATIC STUFF LAST


}
