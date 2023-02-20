import { VirtualSpace } from 'database';
import { ClientTransforms } from 'schemas';
import Venue from './Venue';
import {throttle} from 'lodash';
import Client from './Client';

import { Log } from 'debug-level';

const log = new Log('VR:Space');

process.env.DEBUG = 'VR:Space*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export class VrSpace {
  private venue: Venue;
  private prismaData: VirtualSpace;
  private clients: Venue['clients'];

  // TODO:
  // * Save/load scene model & navmesh model
  // * Save/load avatar pieces. Should vr spaces allow to use different sets of avatar pieces?

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
