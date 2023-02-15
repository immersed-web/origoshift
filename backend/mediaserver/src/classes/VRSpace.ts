import { VirtualSpace } from 'database';
import { ClientTransforms } from 'schemas';
import Venue from './Venue';
import {throttle} from 'lodash';
import Client from './Client';

export class VrSpace {
  private venue: Venue;
  private prismaData: VirtualSpace;
  private clients: Venue['clients'];

  // emitter = new TypedEmitter<VREvents>();
  sendPendingTransforms = throttle(() => {
    this.emitToAllClients('clientTransforms', this.pendingTransforms);
    this.pendingTransforms = {};
  }, 10, {
    trailing: true
  });

  pendingTransforms: ClientTransforms = {};
  constructor(venue: Venue, vrSpace: VirtualSpace, clients: Venue['clients']){
    this.venue = venue;
    this.prismaData = vrSpace;
    this.clients = clients;
  }

  emitToAllClients: Client['vrEvents']['emit'] = (event, ...args) => {
    let allEmittersHadListeners = true;
    this.clients.forEach(c => allEmittersHadListeners &&= c.vrEvents.emit(event, ...args));
    return allEmittersHadListeners;
  };

  // make this instance eligible for GC. Make sure we cut all the references to the instance in here!
  unload() {
    //clean up listeners and such in here!
  }
}
