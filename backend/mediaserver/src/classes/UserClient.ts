import { TypedEmitter } from 'tiny-typed-emitter';

import { Log } from 'debug-level';
const log = new Log('UserClient');
process.env.DEBUG = 'UserClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransform, ClientTransforms, ConnectionId, UserId, UserRole, VenueId, CameraId, ClientType } from 'schemas';
import { Venue } from './InternalClasses';
import { FilteredEvents, NonFilteredEvents } from 'trpc/trpc-utils';
import { BaseClient } from './BaseClient';


export type UserEvents = NonFilteredEvents<{
  'clientState': (data: {reason?: string, clientState: PublicUserClientState}) => void
}>


export type UserVrEvents = NonFilteredEvents<{
  'clientTransforms': (transforms: ClientTransforms) => void
}>


export type PublicUserClientState = {
  connectionId: ConnectionId
  userId: UserId
  userName: string
  role: UserRole
  transform?: ClientTransform
  currentVenueId?: VenueId
  currentCameraId?: CameraId
  isInVrSpace: boolean
}

/**
 * @class
 * This class represents the backend state of a user client connection.
 */
export class UserClient extends BaseClient {

  constructor(...args: ConstructorParameters<typeof BaseClient>){
    super(...args);
    log.info(`Creating user client ${this.username} (${this.connectionId})`);
    log.debug('prismaData:', this.prismaData);


    this.userEvents = new TypedEmitter();
    this.vrEvents = new TypedEmitter();
  }
  readonly clientType = 'client' as const satisfies ClientType;

  transform: ClientTransform | undefined;


  userEvents: TypedEmitter<UserEvents>;
  vrEvents: TypedEmitter<UserVrEvents>;

  unload() {
    this._socketClosed = true;
    log.info(`unloading user client ${ this.username } ${this.connectionId} `);
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
    if(!this.venue){
      throw Error('Something is really off! currentCameraId is set but client isnt in a venue! Invalid state!');
    }
    const camera = this.venue.cameras.get(this.currentCameraId);
    if(!camera){
      throw Error('client had an assigned currentCameraId but that camera was not found in venue. Invalid state!');
    }
    return camera;
  }

  isInVrSpace = false;
  get vrSpace(){
    if(this.isInVrSpace){
      try{
        if(!this.venue){
          // log.error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
          throw Error('The client is considered to be part of a vr space without being in a venue. That shouldnt be possible!');
        }
        return this.venue.vrSpace;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
    return undefined;
  }

  getPublicState(): PublicUserClientState{
    return {
      connectionId: this.connectionId,
      userId: this.userId,
      userName: this.username,
      role: this.role,
      currentVenueId: this.venue?.venueId,
      transform: this.transform,
      currentCameraId: this.currentCamera?.cameraId,
      isInVrSpace: this.isInVrSpace,
    };
  }

  _notifyClientStateUpdated(reason?: string) {
    if(this._socketClosed){
      log.info('skipped emitting to client because socket was already closed');
      return;
    }
    log.info(`emitting clientState for ${this.username} (${this.connectionId})`);
    this.userEvents.emit('clientState', {clientState: this.getPublicState(), reason });
  }

  async joinVenue(venueId: VenueId) {
    this.leaveCurrentVenue();
    const venue = Venue.getVenue(venueId);
    venue.addClient(this);
    this.sendTransport = await venue.createWebRtcTransport();
    this.receiveTransport = await venue.createWebRtcTransport();
    this._notifyClientStateUpdated('user client joined venue');
  }

  leaveCurrentVenue() {
    if(!this.venue) {
      return false;
      // throw Error('cant leave a venue if you are not in one!');
    }
    super.teardownMediasoupObjects();
    this.venue.removeClient(this);
    this._notifyClientStateUpdated('user client left a venue');
    return true;
  }

  joinVrSpace(){
    this.leaveCurrentCamera();
    if(!this.venue){
      throw Error('cant join vrspace if isnt in a venue!');
    }
    if(!this.venue.vrSpace){
      throw Error('cant join vrspace if the venue doesnt have one!');
    }
    this.venue.vrSpace.addClient(this);
    this._notifyClientStateUpdated('user client joined vrSpace');
  }

  leaveVrSpace() {
    if(this.venue?.vrSpace?.removeClient(this)){
      this._notifyClientStateUpdated('user client left vrSpace');
    }
  }

  joinCamera(cameraId: CameraId) {
    const camera = this.venue?.cameras.get(cameraId);
    if(!camera){
      throw Error('no camera with that id exist in the venue');
    }
    camera.addClient(this);
    this._notifyClientStateUpdated('user client joined camera');
  }
  /**
   * @returns boolean indicating if the client was in a camera in the first place. Calling this function when not in a camera will simply do nothing and return false.
   */
  leaveCurrentCamera() {
    if(!this.currentCamera){
      return false;
    }
    this.currentCamera.removeClient(this);
    this._notifyClientStateUpdated('user client left camera');
  }
}
