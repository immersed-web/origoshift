import { TypedEmitter } from 'tiny-typed-emitter';
import { NonFilteredEvents } from 'trpc/trpc-utils';
import { BaseClient, Venue } from './InternalClasses';

import { Log } from 'debug-level';
import { CameraId, ClientType, VenueId } from 'schemas';
import { ProducerId } from 'schemas/mediasoup';
import type { types as soupTypes } from 'mediasoup';

const log = new Log('SenderClient');
process.env.DEBUG = 'SenderClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

type SenderControlEvents = NonFilteredEvents<{
  'startProduceVideoRequest': () => void
  'startProduceAudioRequest': () => void
}>
type SenderClientEvents =  SenderControlEvents
& NonFilteredEvents<{
  'myStateUpdated': (data: { myState: ReturnType<SenderClient['getPublicState']>, reason?: string }) => void
}>;

export class SenderClient extends BaseClient{
  constructor(...args: ConstructorParameters<typeof BaseClient>){
    super(...args);
    // this.base = new BaseClient(...args);
    log.info(`Creating sender client ${this.username} (${this.connectionId})`);
    log.debug('prismaData:', this.prismaData);


    this.senderClientEvent = new TypedEmitter();
  }
  readonly clientType = 'sender' as const satisfies ClientType;

  private cameraId?: CameraId;
  /**
   * **WARNING**: You should never need to call this function, since the camera instance calls this for you when it adds the sender to itself.
   */
  _setCamera(cameraId?: CameraId){
    this.cameraId = cameraId;
  }
  get camera() {
    if(!this.cameraId) return undefined;
    if(!this.venue){
      throw Error('Something is really off! currentCameraId is set but sender isnt in a venue! Invalid state!');
    }
    const camera = this.venue.cameras.get(this.cameraId);
    if(!camera){
      throw Error('client had an assigned currentCameraId but that camera was not found in venue. Invalid state!');
    }
    return camera;
  }
  // base: BaseClient;
  senderClientEvent: TypedEmitter<SenderClientEvents>;

  getPublicState(){
    // const { connectionId, userId, username } = this.base;
    // const producerObj: Record<ProducerId, {producerId: ProducerId, kind: soupTypes.MediaKind }> = {};
    // this.producers.forEach((p) => {
    //   const pId = p.id as ProducerId;
    //   producerObj[pId] = { producerId: pId, kind: p.kind };
    // });
    return {
      ...super.getPublicState(),
      cameraId: this.cameraId,
      clientType: this.clientType,
    };
  }

  _onSenderStateUpdated(reason?: string) {
    if(!this.connectionId){
      log.info('skipped emitting to client because socket was already closed');
      return;
    }
    log.info(`emitting clientState for ${this.username} (${this.connectionId}) to itself`);
    this.senderClientEvent.emit('myStateUpdated', {myState: this.getPublicState(), reason});
  }

  unload() {
    super.unload();
    // this.base.connected = false;
    // this._socketClosed = true;
    log.info(`unloading sender client ${ this.username } ${this.connectionId} `);
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
    if(!this.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    this.teardownMediasoupObjects();
    this.venue.removeClient(this);
    // this._notifyClientStateUpdated('user client left a venue');
    return true;
  }
}
