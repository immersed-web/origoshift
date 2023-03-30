
import { Log } from 'debug-level';
import type { Camera as PrismaCamera } from 'database';
import type { CameraId, SenderId  } from 'schemas';
import {Venue, UserClient, SenderClient} from './InternalClasses';
import { ProducerId } from 'schemas/mediasoup';

const log = new Log('Camera');

process.env.DEBUG = 'Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);


export class Camera {
  constructor(prismaCamera: PrismaCamera, venue: Venue, sender?: SenderClient){
    this.prismaData = prismaCamera;
    this.venue = venue;
    this.clients = new Map();
    if(sender){
      log.info('attaching sender when instantiating camera');
      this.setSender(sender);
    }
  }

  venue: Venue;
  sender?: SenderClient;
  get producers() {
    if(!this.sender) {
      return {};
    }
    return this.sender.getPublicProducers();
  }
  clients: Venue['clients'];
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  prismaData: PrismaCamera;
  get cameraId(){
    return this.prismaData.cameraId as CameraId;
  }
  get senderId() {
    return this.prismaData.senderId as SenderId;
  }
  get name() {
    return this.prismaData.name;
  }
  setName(name: string) {
    this.prismaData.name = name;
  }

  getPublicState() {
    const { cameraId, name, clientIds, senderId, producers } = this;
    // const senderState = this.sender?.getPublicState();
    const senderAttached = !!this.sender;
    const isStreaming = Object.keys(producers).length !== 0;
    return { cameraId, name, clientIds, senderId, senderAttached, isStreaming, producers };
  }

  unload() {
    this.clients.forEach(client => {
      this.removeClient(client);
      // TODO: Notify client they were kicked out of camera
    });
    log.info('Unloading camera not implemented yet?');
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

  _closeAllConsumers() {
    if(this.sender){
      this.sender.producers.forEach(p => this.venue._closeAllConsumersOfProducer(p.id as ProducerId));
    }
  }

  // STATIC STUFF LAST


}
