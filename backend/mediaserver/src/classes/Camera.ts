
import { Log } from 'debug-level';
import type { Camera as PrismaCamera } from 'database';
import type { CameraId, SenderId  } from 'schemas';
import {Venue, UserClient, SenderClient, BaseClient, PublicProducers} from './InternalClasses';
import { ProducerId } from 'schemas/mediasoup';
import { computed, shallowRef, effect } from '@vue/reactivity';

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
    effect(() =>{
      // this.producers;
      log.info('Producers updated:', this.producers.value);
      this._notifyStateUpdated('producers updated');
    }, {
      // lazy: true,
    });
  }

  venue: Venue;
  // sender?: SenderClient;
  sender = shallowRef<SenderClient>();
  producers = computed(() => {
    if(!this.sender.value) {
      // return undefined;
      const emptyProducers: PublicProducers = {};
      return emptyProducers;
    }
    return this.sender.value?.publicProducers.value;
  });
  // get producers() {
  //   if(!this.sender.value) {
  //     // return undefined;
  //     const emptyProducers: PublicProducers = {};
  //     return emptyProducers;
  //   }
  //   return this.sender.value.publicProducers;
  // }
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
    const { cameraId, name, clientIds, senderId } = this;
    // const senderState = this.sender?.getPublicState();
    const senderAttached = !!this.sender;
    const isStreaming = !!this.producers.value.videoProducer || !!this.producers.value.audioProducer;
    return { cameraId, name, clientIds, senderId, senderAttached, isStreaming, producers: this.producers.value };
  }

  unload() {
    // this._closeAllConsumers();
    this.clients.forEach(client => {
      this.removeClient(client);
      // TODO: Notify client they were kicked out of camera
    });
    this.setSender(undefined);
  }

  _notifyStateUpdated(reason?: string) {
    this.clients.forEach(client => {
      client.notify.cameraStateUpdated?.({data: this.getPublicState(), reason});
    });
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

    this._notifyStateUpdated('client added to camera');
  }

  removeClient(client: UserClient){
    //TODO: If we rebuild so some producers can cover over many cameras this will have to be changed.
    client.closeAllConsumers();
    const wasRemoved = this.clients.delete(client.connectionId);
    if(wasRemoved){
      client._setCamera();
    }
    this._notifyStateUpdated('client removed from camera');
    return wasRemoved;
  }

  setSender(sender: SenderClient | undefined){
    if(!sender){
      this.sender.value?._setCamera(undefined);
      this.sender.value = undefined;
      return;
    }
    if(this.sender.value){
      throw Error('trying to set sender in camera when it was already set. This should not happen!');
    }
    this.sender.value = sender;
    sender._setCamera(this.cameraId);
    this._notifyStateUpdated('sender attached to camera');
  }

  // TODO: We probably want to have more lean housekeeping and not manually find all consumers of the producers...
  private _closeAllConsumers() {
    if(this.sender.value){
      if(this.sender.value.videoProducer.value){
        this.venue._closeAllConsumersOfProducer(this.sender.value.videoProducer.value.id as ProducerId);
      }
      if(this.sender.value.audioProducer.value){
        this.venue._closeAllConsumersOfProducer(this.sender.value.audioProducer.value.id as ProducerId);
      }
      // this.sender.producers.forEach(p => this.venue._closeAllConsumersOfProducer(p.id as ProducerId));
    }
  }

}
