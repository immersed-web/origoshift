import { Log } from 'debug-level';
const log = new Log('BaseClient');
process.env.DEBUG = 'BaseClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ConnectionId, JwtUserData, UserId, UserRole, VenueId, ConnectionIdSchema } from 'schemas';
import { types as soupTypes } from 'mediasoup';
import type { types as soupClientTypes } from 'mediasoup-client';
import { ConsumerId, CreateProducerPayload, ProducerId, TransportId  } from 'schemas/mediasoup';
import { SenderClient, UserClient, Venue } from './InternalClasses';
import { CustomListenerSignature, FilteredEvents, NotifierInputData, NonFilteredEvents, NotifierSignature, SingleParamListenerSignature } from 'trpc/trpc-utils';
import { randomUUID } from 'crypto';
import { Prisma, userDeselectPassword, userSelectAll } from 'database';
import prismaClient from '../modules/prismaClient';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';
import { observable } from '@trpc/server/observable';

type SoupObjectClosePayload =
      {type: 'transport', id: TransportId }
      | {type: 'producer', id: ProducerId }
      | {type: 'consumer', id: ConsumerId }

type ClientSoupEvents = FilteredEvents<{
  'producerCreated': (data: {producer: ReturnType<BaseClient['getPublicProducers']>[ProducerId], producingConnectionId: ConnectionId}) => void
}, ConnectionId>
& NonFilteredEvents<{
  'soupObjectClosed': (data: SoupObjectClosePayload & { reason: string}) => void
  'consumerPausedOrResumed': (data: {consumerId: ConsumerId, wasPaused: boolean}) => void
  'producerPausedOrResumed': (data: {producerId: ProducerId, wasPaused: boolean}) => void
}>

type ClientStateUnion = ReturnType<UserClient['getPublicState']> | ReturnType<SenderClient['getPublicState']>

type ClientVenueEvents = FilteredEvents<{
  'clientAddedOrRemoved': (data: {client: ReturnType<UserClient['getPublicState']>, added: boolean}) => void,
  'senderAddedOrRemoved': (data: {client: ReturnType<SenderClient['getPublicState']>, added: boolean}) => void,
}, ConnectionId>
& NonFilteredEvents<{
  'venueWasUnloaded': (venueId: VenueId) => void,
}>

type ClientClientEvents = FilteredEvents<{
  'someClientStateUpdated': (data: { clientState: ClientStateUnion, reason?: string }) => void
  // 'senderState': (data: { senderState: ReturnType<SenderClient['getPublicState']>, reason?: string }) => void
}, ConnectionId>

export type AllClientEvents = ClientSoupEvents & ClientVenueEvents & ClientClientEvents

const userQuery = {
  select: {
    ...userSelectAll,
    ...userDeselectPassword
  }
} satisfies Prisma.UserArgs;
type UserResponse = Prisma.UserGetPayload<typeof userQuery>
interface ClientConstructorParams {
  connectionId?: ConnectionId,
  // ws: SocketWrapper,
  jwtUserData: JwtUserData,
  prismaData?: UserResponse
}

export async function loadUserPrismaData(userId: UserId){
  const response = await prismaClient.user.findUniqueOrThrow({
    where: {
      userId
    },
    select: {
      ...userSelectAll,
      ...userDeselectPassword,
    }
  });
  // return response === null ? undefined : response;
  return response;
}

// type ConditionalEventType<E extends ListenerSignature<E>> = E extends ListenerSignature<E>? E: unknown;
// class Animal<E extends ListenerSignature<E> = ListenerSignature<unknown>>{
//   event: TypedEmitter<AllClientEvents>;
//   constructor() {
//     this.event = new TypedEmitter();
//     this.event.emit('soupObjectClosed', {type: 'producer', id: 'asd' as ProducerId, reason: 'asdfasdf'});
//     this.event.emit('producerPausedOrResumed', {producerId: 'aas' as ProducerId, wasPaused: true});
//     // super();
//     // this.emit('',);
//   }
// }


// class Frog extends Animal<{jump: (msg: string) => void}> {
//   constructor() {
//     super();
//     this.event.emit('jump', 'juuump');
//     this.event.emit('soupObjectClosed', {type: 'producer', id: 'asas' as ProducerId, reason: 'aasfas'});
//   }
// }

/**
 * @class
 * Base class for backend state of client connection. You should probably not use the base class directly.
 */
export class BaseClient {
  constructor({connectionId = ConnectionIdSchema.parse(randomUUID()), jwtUserData, prismaData}: ClientConstructorParams) {
    // super();
    this.connectionId = connectionId;
    this.jwtUserData = jwtUserData;
    this.prismaData = prismaData;


    this.clientEvent = new TypedEmitter();


    // this.event = new TypedEmitter();
    // this.soupEvents = new TypedEmitter();
    // this.venueEvents = new TypedEmitter();
    // this.clientEvents.addListener('clientStateUpdated', (state) => log.info(`${this.userId} received clientStateUpdated event triggered by ${triggeringConnection}:`, state.clientPublicState));
  }

  clientEvent: TypedEmitter<AllClientEvents>;

  connected = true;

  notify = {
    newProducerInCamera: undefined as NotifierSignature<{added: true} & ReturnType<typeof this.getPublicProducers>[ProducerId]>,
    producerRemovedInCamera: undefined as NotifierSignature<{added: false, producerId: ProducerId }>
  };


  /**
  * The id of the actual connection. This differs from the userId, as a user could potentially have multiple concurrent active connections
  */
  connectionId: ConnectionId;
  prismaData?: UserResponse;
  get allowedVenues(){
    if(!this.prismaData){
      return [];
    }
    return [...this.prismaData.allowedVenues, ...this.prismaData.ownedVenues];
  }
  get ownedVenues() {
    if(!this.prismaData) {
      return [];
    }
    return this.prismaData.ownedVenues;
  }

  jwtUserData: JwtUserData;

  /**
   * The user's id. Be aware that this doesn't uniquely identify the active connection/session, as the user could run multiple concurrent connections.
   * Instead, use "connectionId" for that.
   */
  get userId(): UserId {
    return this.jwtUserData.userId;
  }
  get username(): string{
    return this.jwtUserData.username;
  }
  get role (): UserRole {
    return this.jwtUserData.role;
  }

  rtpCapabilities?: soupTypes.RtpCapabilities;
  receiveTransport?: soupTypes.WebRtcTransport;
  sendTransport?: soupTypes.WebRtcTransport;
  consumers: Map<ConsumerId, soupTypes.Consumer> = new Map();
  producers: Map<ProducerId, soupTypes.Producer> = new Map();

  // soupEvents: TypedEmitter<ClientSoupEvents>;
  // venueEvents: TypedEmitter<ClientVenueEvents>;
  // clientEvents: TypedEmitter<ClientEvents>;
  // abstract event: TypedEmitter;

  protected venueId?: VenueId;
  /**
   * **WARNING**: You should never need to call this function, since the venue instance calls this for you when it adds a client to itself.
   */
  _setVenue(venueId: VenueId | undefined){
    this.venueId = venueId;
    // this.getVenue()?.createWebRtcTransport();
  }
  get venue() {
    try{
      if(!this.venueId) return undefined;
      // return getVenue(this.venueId);
      return Venue.getVenue(this.venueId);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  getPublicProducers(){
    const producerObj: Record<ProducerId, {producerId: ProducerId, kind: soupTypes.MediaKind, paused: boolean }> = {};
    this.producers.forEach((p) => {
      const pId = p.id as ProducerId;
      producerObj[pId] = { producerId: pId, kind: p.kind, paused: p.paused};
    });
    return producerObj;
  }

  getPublicState(){
    return {
      connectionId: this.connectionId,
      userId: this.userId,
      username: this.username,
      role: this.role,
      currentVenueId: this.venue?.venueId,
      producers: this.getPublicProducers(),
    };
  }

  // NOTE: It's important we release all references here!
  unload() {
    // log.info(`unloading base client ${ this.username } ${this.connectionId} `);
    this.connected = false;

    // This will call the extending class's leave function if called from descendant
    // this.teardownMediasoupObjects();
    // this.leaveCurrentVenue();
  }

  // leaveCurrentVenue() {
  //   if(!this.venue) {
  //     return false;
  //     // throw Error('cant leave a venue if you are not in one!');
  //   }
  //   this.teardownMediasoupObjects();
  //   return true;
  // }

  /**
   * closes all mediasoup related object and instances.
   */
  teardownMediasoupObjects() {
    this.closeAllProducers();
    this.closeAllConsumers();
    this.closeAllTransports();
    return true;
  }

  async createWebRtcTransport(direction: 'send' | 'receive'){
    log.info(`creating (${direction}) webrtcTransport`);
    if(!this.venue) {
      throw Error('must be in a venue in order to create transport');
    }
    const transport = await this.venue.createWebRtcTransport();
    if(!transport){
      throw new Error('failed to create transport!!');
    }
    transport.addListener('routerclose', () => {
      log.info('transport event: router closed');
      this.clientEvent.emit('soupObjectClosed', {type: 'transport', id: transport.id as TransportId, reason: 'router was closed'});
      if(direction == 'receive'){
        this.receiveTransport = undefined;
      } else {
        this.sendTransport = undefined;
      }
      // this.send(createMessage('notifyCloseEvent', {
      //   objectType: 'transport',
      //   objectId: transport.id,
      // }));
    });
    if(direction == 'receive'){
      this.receiveTransport = transport;
    } else {
      this.sendTransport = transport;
    }
    return this.getTransportOptions(transport);
  }

  private getTransportOptions(transport: soupTypes.WebRtcTransport){
    const { id, iceParameters, dtlsParameters } = transport;
    const iceCandidates = <soupClientTypes.IceCandidate[]>transport.iceCandidates;
    const transportOptions: soupClientTypes.TransportOptions = {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    };
    return transportOptions;
  }

  async createProducer(produceOptions: CreateProducerPayload){
    if(!this.sendTransport){
      throw Error('no transport. Cant produce');
    }
    const {kind, rtpParameters, producerInfo, producerId} = produceOptions;
    const appData = { producerInfo };
    const producer: soupTypes.Producer = await this.sendTransport.produce({ id: producerId,  kind, rtpParameters, appData});
    producer.on('transportclose', () => {
      console.log(`transport for producer ${producer.id} was closed`);
      this.producers.delete(producer.id as ProducerId);
      this.clientEvent.emit('soupObjectClosed', {type: 'producer', id: producer.id as ProducerId, reason: 'transport was closed'});
    });
    this.producers.set(producer.id as ProducerId, producer);
    return producer.id as ProducerId;
  }

  closeAllTransports() {
    if(this.sendTransport){
      this.sendTransport.close();
      // this.event.emit('transportClosed', this.sendTransport.id as TransportId);
      this.clientEvent.emit('soupObjectClosed', {type: 'transport', id: this.sendTransport.id as TransportId, reason: 'closing all transports for client'});
      this.sendTransport = undefined;
    }
    if(this.receiveTransport){
      this.receiveTransport.close();
      this.clientEvent.emit('soupObjectClosed', {type: 'transport', id: this.receiveTransport.id as TransportId, reason: 'closing all transports for client'});
      this.receiveTransport = undefined;
    }
  }

  closeAllProducers = () => {
    const producerArray = Array.from(this.producers.entries());
    for(const [producerKey, producer] of producerArray){
      producer.close();
      this.clientEvent.emit('soupObjectClosed', {type: 'producer', id: producer.id as ProducerId, reason: 'closing all producers for client'});
      this.producers.delete(producerKey);
    }
    // this.room?.broadcastRoomState('a client closed all their producers');
  };

  closeAllConsumers = () => {
    const consumerArray = Array.from(this.consumers.entries());
    for(const [consumerKey, consumer] of consumerArray){
      consumer.close();
      this.clientEvent.emit('soupObjectClosed', {type: 'consumer', id: consumer.id as ConsumerId, reason: 'closing all consumers for client'});
      this.consumers.delete(consumerKey);
    }
  };
}
