import { VirtualSpace } from 'database';
import { ClientTransforms } from 'schemas';
import Venue from './Venue';
import {throttle} from 'lodash';
// import { NonFilteredEvents } from 'trpc/trpc-utils';
import { TypedEmitter } from 'tiny-typed-emitter';

// type VREvents = NonFilteredEvents<{
//   'transforms': (transforms: ClientTransforms) => void
// }>


export class VRSpace {
  private venue: Venue;
  private prismaData: VirtualSpace;

  // emitter = new TypedEmitter<VREvents>();
  sendPendingTransforms = throttle(() => {

    this.venue.emitToAllClients('clientTransforms', this.pendingTransforms);
    // this.emitter.emit('transforms', this.pendingTransforms);
    this.pendingTransforms = {};
  }, 200, {
    trailing: true
  });

  pendingTransforms: ClientTransforms = {};
  constructor(venue: Venue, vrSpace: VirtualSpace){
    this.venue = venue;
    this.prismaData = vrSpace;
  }

  // make this instance eligible for GC. Make sure we cut all the references to the instance in here!
  unload() {
    //clean up listeners and such in here!
  }
}
