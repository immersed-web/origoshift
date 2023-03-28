import { Log } from 'debug-level';
const log = new Log('BaseClient');
process.env.DEBUG = 'BaseClient*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ConnectionId, JwtUserData, UserId, UserRole, VenueId, ConnectionIdSchema } from 'schemas';
import { types as soupTypes } from 'mediasoup';
import type { types as soupClientTypes } from 'mediasoup-client';
import { ConsumerId, CreateConsumerPayload, CreateProducerPayload, ProducerId, TransportId  } from 'schemas/mediasoup';
import { SenderClient, UserClient, Venue } from './InternalClasses';
import { CustomListenerSignature, FilteredEvents, NotifierInputData, NonFilteredEvents, NotifierSignature, SingleParamListenerSignature } from 'trpc/trpc-utils';
import { randomUUID } from 'crypto';
import { Prisma, userDeselectPassword, userSelectAll } from 'database';
import prismaClient from '../modules/prismaClient';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';
import { observable } from '@trpc/server/observable';
import { keyBy } from 'lodash';

type SoupObjectClosePayload =
      {type: 'transport', id: TransportId }
      | {type: 'producer', id: ProducerId }
      | {type: 'consumer', consumerInfo: { consumerId: ConsumerId, producerId: ProducerId }}

// type CreatedConsumerResponse = Pick<soupTypes.Consumer, 'id' | 'kind' | 'rtpParameters'> & { producerId: ProducerId}

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

export async function loadUserPrismaData(userId: UserId){
  const response = await prismaClient.user.findUniqueOrThrow({
    ...userQuery,
    where: {
      userId
    },
  });
  // return response === null ? undefined : response;
  return response;
}

interface ClientConstructorParams {
  connectionId?: ConnectionId,
  // ws: SocketWrapper,
  jwtUserData: JwtUserData,
  prismaData?: UserResponse
}
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
    venueStateUpdated: undefined as NotifierSignature<ReturnType<Venue['getPublicState']>>,
    // camera: {
    newProducerInCamera: undefined as NotifierSignature<{added: true} & ReturnType<typeof this.getPublicProducers>[ProducerId]>,
    producerRemovedInCamera: undefined as NotifierSignature<{added: false, producerId: ProducerId }>,
    // },
    // soup: {
    soupObjectClosed: undefined as NotifierSignature<SoupObjectClosePayload>,
    consumerPausedOrResumed: undefined as NotifierSignature<{consumerId: ConsumerId, wasPaused: boolean}>,
    producerPausedOrResumed: undefined as NotifierSignature<{producerId: ProducerId, wasPaused: boolean}>,
    // },
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
  consumers: Map<ProducerId, soupTypes.Consumer> = new Map();
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
    // const ownedVenues = this.ownedVenues.map(v => v.venueId);

    // const ownedVenues = keyBy(this.ownedVenues, (v) => v.venueId);
    const ownedVenues = this.ownedVenues.reduce<Record<VenueId, {venueId: VenueId, name: string}>>((acc, venue) => {
      const {venueId, name} = venue;
      acc[venueId as VenueId] = {venueId: venueId as VenueId, name};
      return acc;
    }, {});
    return {
      connectionId: this.connectionId,
      userId: this.userId,
      username: this.username,
      role: this.role,
      currentVenueId: this.venue?.venueId,
      producers: this.getPublicProducers(),
      ownedVenues
    };
  }

  // NOTE: It's important we release all references here!
  unload() {
    // log.info(`unloading base client ${ this.username } ${this.connectionId} `);
    this.connected = false;
  }

  protected _onLeavingVenue(){
    this.teardownMediasoupObjects();
  }

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

  async createConsumer(consumerOptions: {producerId: ProducerId, paused?: boolean}){
    if(!this.receiveTransport){
      throw Error('A transport is required to create a consumer');
    }

    if(!this.rtpCapabilities){
      throw Error('rtpCapabilities of client unknown. Provide them before requesting to consume');
    }
    const { producerId, paused } = consumerOptions;
    const canConsume = this.venue?.router.canConsume({ producerId, rtpCapabilities: this.rtpCapabilities});
    if( !canConsume){
      throw Error('Client is not capable of consuming the producer according to provided rtpCapabilities');
    }

    const consumer = await this.receiveTransport.consume({
      producerId: producerId,
      rtpCapabilities: this.rtpCapabilities,
      paused,
    });

    const consumerId = consumer.id as ConsumerId;

    this.consumers.set(producerId, consumer);

    consumer.on('transportclose', () => {
      log.info(`---consumer transport close--- clientConnection: ${this.connectionId} consumer_id: ${consumerId}`);
      this.consumers.delete(producerId);
      this.notify.soupObjectClosed?.({data: {type: 'consumer', consumerInfo: { consumerId, producerId }}, reason: 'transport for the consumer was closed'});
    });

    consumer.on('producerclose', () => {
      log.info(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
      this.consumers.delete(producerId);
      if(!this.notify.soupObjectClosed){
        log.info('NO NOTIFIER ATTACHED for Client!');
      }
      this.notify.soupObjectClosed?.({data: {type: 'consumer', consumerInfo: { consumerId, producerId }}, reason: 'transport for the consumer was closed'});
    });

    consumer.on('producerpause', () => {
      log.info('producer was paused! Handler NOT IMPLEMENTED YET!');
    });
    consumer.on('producerresume', () => {
      log.info('producer was resumed! Handler NOT IMPLEMENTED YET!');
    });

    const {id, kind, rtpParameters} = consumer;
    return {
      id: id as ConsumerId, producerId, kind, rtpParameters
    };
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
    for(const [producerId, consumer] of consumerArray){
      consumer.close();
      this.clientEvent.emit('soupObjectClosed', {type: 'consumer', consumerInfo: {consumerId: consumer.id as ConsumerId, producerId}, reason: 'closing all consumers for client'});
      this.consumers.delete(producerId);
    }
  };
}
