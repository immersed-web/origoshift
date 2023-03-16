import { TypedEmitter } from 'tiny-typed-emitter';
import { NonFilteredEvents } from 'trpc/trpc-utils';
import { BaseClient, Venue } from './InternalClasses';

import { Log } from 'debug-level';
import { ClientType, VenueId } from 'schemas';
import { ProducerId } from 'schemas/mediasoup';
import type { types as soupTypes } from 'mediasoup';

const log = new Log('SenderClient');
process.env.DEBUG = 'SenderClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export type SenderClientEvents = NonFilteredEvents<{
  'startProduceVideoRequest': () => void
  'startProducerAudioRequest': () => void
}>

export class SenderClient {
  constructor(...args: ConstructorParameters<typeof BaseClient>){
    this.base = new BaseClient(...args);
    log.info(`Creating sender client ${this.base.username} (${this.base.connectionId})`);
    log.debug('prismaData:', this.base.prismaData);


    this.event = new TypedEmitter();
  }
  readonly clientType = 'sender' as const satisfies ClientType;

  base: BaseClient;
  event: TypedEmitter<SenderClientEvents>;

  getPublicState(){
    // const { connectionId, userId, username } = this.base;
    const producerList: {producerId: ProducerId, kind: soupTypes.MediaKind}[] = [];
    this.base.producers.forEach((p) => producerList.push({producerId: (p.id as ProducerId), kind: p.kind}));
    return {
      ...this.base.getPublicState(),
      clientType: this.clientType,
      producers: producerList
    };
  }

  _onClientStateUpdated(reason?: string) {
    if(!this.base.connectionId){
      log.info('skipped emitting to client because socket was already closed');
      return;
    }
    log.info(`emitting clientState for ${this.base.username} (${this.base.connectionId}) to itself`);
    this.base.event.emit('senderState', {senderState: this.getPublicState(), reason }, );
  }

  unload() {
    this.base.unload();
    // this.base.connected = false;
    // this._socketClosed = true;
    log.info(`unloading sender client ${ this.base.username } ${this.base.connectionId} `);
    // super.unload();
    this.leaveCurrentVenue();
  }

  async joinVenue(venueId: VenueId){
    this.leaveCurrentVenue();
    const venue = Venue.getVenue(venueId);
    // venue.addSenderClient(this);
    venue.addClient(this);
    // await this.createWebRtcTransport('send');
    // await this.createWebRtcTransport('receive');
    // this._notifyClientStateUpdated('user client joined venue');
  }

  leaveCurrentVenue() {
    if(!this.base.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    this.base.teardownMediasoupObjects();
    this.base.venue.removeClient(this);
    // this._notifyClientStateUpdated('user client left a venue');
    return true;
  }
}
