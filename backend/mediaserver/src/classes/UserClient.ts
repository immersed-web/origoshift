import { TypedEmitter } from 'tiny-typed-emitter';

import { Log } from 'debug-level';
const log = new Log('UserClient');
process.env.DEBUG = 'UserClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransform, ClientTransforms, ConnectionId, UserId, UserRole, VenueId, CameraId, ClientType } from 'schemas';
import { Venue } from './InternalClasses';
import { FilteredEvents, NonFilteredEvents } from 'trpc/trpc-utils';
import { BaseClient } from './BaseClient';


// export type UserEvents = NonFilteredEvents<{
//   'clientState': (data: {reason?: string, clientState: ReturnType<UserClient['getPublicState']>}) => void
// }>


export type UserVrEvents = NonFilteredEvents<{
  'clientTransforms': (transforms: ClientTransforms) => void
}>

type UserClientEvents = UserVrEvents;


// export type PublicUserClientState = {
//   connectionId: ConnectionId
//   userId: UserId
//   userName: string
//   role: UserRole
//   transform?: ClientTransform
//   currentVenueId?: VenueId
//   currentCameraId?: CameraId
//   isInVrSpace: boolean
// }

/**
 * @class
 * This class represents the backend state of a user client connection.
 */
export class UserClient {
  constructor(...args: ConstructorParameters<typeof BaseClient>){
    // super(...args);
    this.base = new BaseClient(...args);
    log.info(`Creating user client ${this.base.username} (${this.base.connectionId})`);
    log.debug('prismaData:', this.base.prismaData);



    this.event = new TypedEmitter();
    // this.userEvents = new TypedEmitter();
    // this.vrEvents = new TypedEmitter();

  }
  readonly clientType = 'client' as const satisfies ClientType;
  base: BaseClient;

  transform: ClientTransform | undefined;


  event: TypedEmitter<UserClientEvents>;
  // userEvents: TypedEmitter<UserEvents>;
  // vrEvents: TypedEmitter<UserVrEvents>;

  unload() {
    this.base.connected = false;
    log.info(`unloading user client ${ this.base.username } ${this.base.connectionId} `);
    this.leaveCurrentVenue();
  }

  private currentCameraId?: CameraId;
  /**
   * **WARNING**: You should never need to call this function, since the camera instance calls this for you when it adds a client to itself.
   */
  _setCamera(cameraId?: CameraId){
    this.currentCameraId = cameraId;
  }
  get currentCamera() {
    if(!this.currentCameraId) return undefined;
    if(!this.base.venue){
      throw Error('Something is really off! currentCameraId is set but client isnt in a venue! Invalid state!');
    }
    const camera = this.base.venue.cameras.get(this.currentCameraId);
    if(!camera){
      throw Error('client had an assigned currentCameraId but that camera was not found in venue. Invalid state!');
    }
    return camera;
  }

  isInVrSpace = false;
  get vrSpace(){
    if(this.isInVrSpace){
      try{
        if(!this.base.venue){
          // log.error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
          throw Error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
        }
        return this.base.venue.vrSpace;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
    return undefined;
  }

  getPublicState(){
    return {
      ...this.base.getPublicState(),
      clientType: this.clientType,
      transform: this.transform,
      currentCameraId: this.currentCamera?.cameraId,
      isInVrSpace: this.isInVrSpace,
    };
  }

  _onClientStateUpdated(reason?: string) {
    if(!this.base.connected){
      log.info('skipped emitting to client because socket was already closed');
      return;
    }
    log.info(`emitting clientState for ${this.base.username} (${this.base.connectionId}) to itself`);
    // we emit the new clientstate to the client itself.
    this.base.event.emit('clientState', {clientState: this.getPublicState(), reason });
  }

  async joinVenue(venueId: VenueId) {
    this.leaveCurrentVenue();
    const venue = Venue.getVenue(venueId);
    venue.addClient(this);
    this.base.sendTransport = await venue.createWebRtcTransport();
    this.base.receiveTransport = await venue.createWebRtcTransport();
    this._onClientStateUpdated('user client joined venue');
  }

  leaveCurrentVenue() {
    if(!this.base.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    this.base.teardownMediasoupObjects();
    this.base.venue.removeClient(this);
    this._onClientStateUpdated('user client left a venue');
    return true;
  }

  joinVrSpace(){
    this.leaveCurrentCamera();
    if(!this.base.venue){
      throw Error('cant join vrspace if isnt in a venue!');
    }
    if(!this.base.venue.vrSpace){
      throw Error('cant join vrspace if the venue doesnt have one!');
    }
    this.base.venue.vrSpace.addClient(this);
    this._onClientStateUpdated('user client joined vrSpace');
  }

  leaveVrSpace() {
    if(this.base.venue?.vrSpace?.removeClient(this)){
      this._onClientStateUpdated('user client left vrSpace');
    }
  }

  joinCamera(cameraId: CameraId) {
    const camera = this.base.venue?.cameras.get(cameraId);
    if(!camera){
      throw Error('no camera with that id exist in the venue');
    }
    camera.addClient(this);
    this._onClientStateUpdated('user client joined camera');
  }

  /**
   * @returns boolean indicating if the client was in a camera in the first place. Calling this function when not in a camera will simply do nothing and return false.
   */
  leaveCurrentCamera() {
    if(!this.currentCamera){
      return false;
    }
    this.currentCamera.removeClient(this);
    this._onClientStateUpdated('user client left camera');
  }
}
