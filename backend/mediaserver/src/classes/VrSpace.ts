import type { VirtualSpace } from 'database';
import { ClientTransforms, VrSpaceId } from 'schemas';
// import type Venue from './Venue';
import { throttle} from 'lodash';
// import Client from './Client';
import type { UserClient, Venue } from './InternalClasses';

import { Log } from 'debug-level';

const log = new Log('VR:Space');

process.env.DEBUG = 'VR:Space*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export class VrSpace {
  private _isOpen = false;
  private venue: Venue;
  private prismaData: VirtualSpace;
  private clients: Venue['clients'];

  get vrSpaceId() {
    return this.prismaData.vrId as VrSpaceId;
  }

  // TODO:
  // * Save/load scene model & navmesh model
  // * Save/load avatar pieces. Should vr spaces allow to use different sets of avatar pieces?


  pendingTransforms: ClientTransforms = {};
  constructor(venue: Venue, vrSpace: VirtualSpace){
    this.venue = venue;
    this.prismaData = vrSpace;
    this.clients = new Map();
  }

  get isOpen(){
    return this._isOpen;
  }

  open () {
    this._isOpen = true;
  }

  close () {
    this._isOpen = false;
    this.clients.forEach(client => {
      this.removeClient(client);
    });
  }

  getPublicState() {
    return 'NOT IMPLEMENTED YET';
  }

  addClient (client: UserClient){
    if(!this.isOpen){
      log.warn(`You tried to add client ${client.username} to the vr space in ${this.venue.name} that isnt open. No bueno!`);
      return;
    }
    if(!this.venue.clientList.includes(client.connectionId)){
      throw Error('must be in the related venue when joining a vr space!');
    }
    this.clients.set(client.connectionId, client);
    client.isInVrSpace = true;
  }

  removeClient (client: UserClient){
    client.isInVrSpace = false;
    return this.clients.delete(client.connectionId);
  }

  sendPendingTransforms = throttle(() => {
    this.emitToAllClients('clientTransforms', this.pendingTransforms);
    this.pendingTransforms = {};
  }, 100, {
    trailing: true
  });

  emitToAllClients: UserClient['vrEvents']['emit'] = (event, ...args) => {
    let allEmittersHadListeners = true;
    this.clients.forEach(c => {
      const hadEmitter = c.vrEvents.emit(event, ...args);
      allEmittersHadListeners &&= hadEmitter;
      log.debug(`emitted ${event} to ${c.username} (${c.connectionId}), had listener(s): ${hadEmitter}`);
    });
    if(!allEmittersHadListeners){
      log.warn('not all emitters had attached listeners');
    }
    return allEmittersHadListeners;
  };

  // make this instance eligible for GC. Make sure we cut all the references to the instance in here!
  unload() {
    //clean up listeners and such in here!
  }
}
