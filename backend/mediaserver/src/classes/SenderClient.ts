import { TypedEmitter } from 'tiny-typed-emitter';
import { NonFilteredEvents } from 'trpc/trpc-utils';
import { BaseClient, Venue } from './InternalClasses';


import { Log } from 'debug-level';
import { VenueId } from 'schemas';
const log = new Log('SenderClient');
process.env.DEBUG = 'SenderClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export type SenderEvents = NonFilteredEvents<{
  'startProduceVideoRequest': () => void
  'startProducerAudioRequest': () => void
}>

export class SenderClient extends BaseClient {
  senderEvents: TypedEmitter<SenderEvents>;

  constructor(...args: ConstructorParameters<typeof BaseClient>){
    super(...args);
    log.info(`Creating sender client ${this.username} (${this.connectionId})`);
    log.debug('prismaData:', this.prismaData);

    this.senderEvents = new TypedEmitter();
  }

  getPublicState(){
    return {
      userId: this.userId,

    };
  }

  unload() {
    this._socketClosed = true;
    log.info(`unloading sender client ${ this.username } ${this.connectionId} `);
    // super.unload();
    this.leaveCurrentVenue();
  }

  async joinVenue(venueId: VenueId){
    this.leaveCurrentVenue();
    const venue = Venue.getVenue(venueId);
    venue.addSenderClient(this);
    this.sendTransport = await venue.createWebRtcTransport();
    this.receiveTransport = await venue.createWebRtcTransport();
    // this._notifyClientStateUpdated('user client joined venue');
  }

  leaveCurrentVenue() {
    if(!this.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    super.teardownMediasoupObjects();
    this.venue.removeSenderClient(this);
    // this._notifyClientStateUpdated('user client left a venue');
    return true;
  }
}
