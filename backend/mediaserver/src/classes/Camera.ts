
import { Log } from 'debug-level';
import type { CameraId, ConnectionId, SenderId  } from 'schemas';
import {Venue, UserClient, SenderClient, BaseClient, PublicProducers} from './InternalClasses';
import { ProducerId } from 'schemas/mediasoup';
import { computed, shallowRef, effect } from '@vue/reactivity';
import prismaClient, { CameraWithIncludes, cameraIncludeStuff } from '../modules/prismaClient';
import _ from 'lodash';

const log = new Log('Camera');

process.env.DEBUG = 'Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export class Camera {
  constructor(prismaCamera: CameraWithIncludes, venue: Venue, sender?: SenderClient){
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
    });
    
    // end constructor with saving back to db
    this.saveToDb();
  }

  venue: Venue;
  sender = shallowRef<SenderClient>();
  producers = computed(() => {
    if(!this.sender.value) {
      // return undefined;
      const emptyProducers: PublicProducers = {};
      return emptyProducers;
    }
    return this.sender.value?.publicProducers.value;
  });
  clients: Venue['clients'];
  get clientIds() {
    return Array.from(this.clients.keys());
  }

  prismaData: CameraWithIncludes;
  get cameraId(){
    return this.prismaData.cameraId as CameraId;
  }
  get senderId() {
    return this.prismaData.senderId as SenderId;
  }
  get name() {
    return this.prismaData.name;
  }
  // TODO: Actually write to db!!!
  setName(name: string) {
    this.prismaData.name = name;
  }
  
  get portals() {
    return this.prismaData.cameraPortals.reduce<Record<CameraId, Omit<(typeof this.prismaData.cameraPortals[number]), 'toCameraId'> & {toCameraId: CameraId}>>((prev, cur) => {
      prev[cur.toCameraId as CameraId] = cur as {x: number, y: number, distance: number, toCameraId: CameraId};
      return prev;
    }, {});
    // return _.keyBy(this.prismaData.cameraPortals, (p) => p.toCameraId);
    // return this.prismaData.cameraPortals;
  }
  
  // TODO: handle save of settings json
  async saveToDb(){
    const { cameraPortals, settings, ...data } = this.prismaData;
    // const jsonSettings: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull = settings;
    log.info('saving to db');
    await prismaClient.camera.update({
      where: {
        cameraId: this.cameraId,
      },
      data: {
        ...data,
        // settings: jsonSettings,
      },
      include: cameraIncludeStuff,
    });
  }

  getPublicState() {
    const { cameraId, name, clientIds, senderId, portals } = this;
    const { viewOriginX, viewOriginY, fovStart, fovEnd, cameraType } = this.prismaData;
    const viewOrigin = {x: viewOriginX, y: viewOriginY };
    const FOV = { fovStart, fovEnd };
    // const senderState = this.sender?.getPublicState();
    const senderAttached = !!this.sender.value;
    const isStreaming = !!this.producers.value.videoProducer || !!this.producers.value.audioProducer;
    return { cameraId, name, clientIds, senderId, cameraType, FOV, viewOrigin, portals, senderAttached, isStreaming, producers: this.producers.value };
  }

  unload() {
    // this._closeAllConsumers();
    this.clients.forEach(client => {
      this.removeClient(client);
      // TODO: Notify client they were kicked out of camera
    });
    this.setSender(undefined);
  }

  _notifyStateUpdated(reason?: string, skipClientWithId?: ConnectionId) {
    this.clients.forEach(client => {
      if(client.connectionId === skipClientWithId) return;
      log.info(`notifying cameraState (${reason}) to client ${client.username} (${client.connectionId})`);
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

    this._notifyStateUpdated('client added to camera', client.connectionId);
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
    if(!sender.senderId){
      throw Error('trying to set sender for camera, but the provided senderClient has no senderId');
    }
    this.prismaData.senderId = sender.senderId;
    // await this.saveToDb();
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
