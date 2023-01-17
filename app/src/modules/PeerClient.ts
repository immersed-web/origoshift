import { types as mediasoupTypes } from 'mediasoup-client';
import * as mediasoupClient from 'mediasoup-client';
// import { createSocket, tearDown, sendRequest, socketEvents } from 'src/modules/webSocket';
import socketutils from 'src/modules/webSocket';
import { createRequest, Message, RequestSubjects, Request, MessageSubjects, AnyResponse } from 'shared-types/MessageTypes';
import { ClientProperties, ProducerInfo, RoomProperties } from 'shared-types/CustomTypes';
import { TypedEmitter } from 'tiny-typed-emitter';

type MsgEvents = {
  [event in MessageSubjects]: (data: Message<event>['data']) => void;
};
type ReqEvents = {
  [event in RequestSubjects]: (msgId: number, data: Request<event> extends { data: unknown } ? Request<event>['data'] : undefined) => void;
}

type AbortEvent = (reason: string) => void;

type PeerEvents = MsgEvents & ReqEvents & { abort: AbortEvent };
interface TransportProduceParams {
  kind: mediasoupTypes.MediaKind;
  rtpParameters: mediasoupTypes.RtpParameters;
  appData: {
    producerInfo: ProducerInfo
  }
}
export default class PeerClient extends TypedEmitter<PeerEvents> {
  // id = '';
  // url?: string;
  mediasoupDevice?: mediasoupTypes.Device;
  sendTransport?: mediasoupTypes.Transport;
  receiveTransport?: mediasoupTypes.Transport;
  producers = new Map<string, mediasoupTypes.Producer>();
  consumers = new Map<string, mediasoupTypes.Consumer>();
  routerRtpCapabilities?: mediasoupTypes.RtpCapabilities;
  socketEvents = socketutils.socketEvents;

  connect = async (token: string) => {
    console.log('Connecting peerClient!');
    socketutils.tearDown();
    try {
      await socketutils.createSocket(token);
    } catch (e) {
      console.error('create socket promise threw:', e);
    }
    // const clientStateReq = createRequest('getClientState');
    // return socketutils.sendRequest(clientStateReq);
  };

  disconnect = () => {
    socketutils.tearDown();
    this.clear();
  };

  private clear = () => {
    this.mediasoupDevice = undefined;
    this.sendTransport = undefined;
    this.receiveTransport = undefined;
    this.producers.clear();
    this.consumers.clear();
    this.routerRtpCapabilities = undefined;
  };

  constructor () {
    super();

    socketutils.socketEvents.on('message', (msg) => {
      // TODO: Find a way to do this! I shouldnt have to type narrow the arguments since I know the possible types of the two parameters map correctly to each other
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.emit(msg.subject, msg.data);
      switch (msg.subject) {
        case 'notifyCloseEvent': {
          switch (msg.data.objectType) {
            case 'producer': {
              const producer = this.producers.get(msg.data.objectId);
              if (!producer) {
                throw Error(`no producer with that id found in client: ${msg.data.objectId}`);
              }
              this.producers.delete(producer.id);
              producer.close();
              break;
            }
            case 'consumer': {
              const consumer = this.consumers.get(msg.data.objectId);
              if (!consumer) {
                throw Error(`no consumer with that id found in client: ${msg.data.objectId}`);
              }
              this.consumers.delete(consumer.id);
              consumer.close();
              break;
            }
            default: {
              console.error('NotifyCloseEvent with no implemented handler was triggered:', msg);
              break;
            }
          }
          break;
        }
        default: {
          console.log(`message received ${msg.subject}`, msg);
          break;
        }
      }
    });
    socketutils.socketEvents.on('request', reqMsg => {
      console.log('received request: ', reqMsg);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.emit(reqMsg.subject, reqMsg.id, reqMsg.data);
    });

    socketutils.socketEvents.on('close', (ev) => {
      if (ev.code === 1006) {
        this.emit('abort', 'not allowed');
      }
    });

    // try {
    //   this.mediasoupDevice = this.createDevice();
    // } catch (error) {
    //   if (error instanceof mediasoupTypes.UnsupportedError && error.name === 'UnsupportedError') {
    //     console.warn('browser not supported');
    //   } else {
    //     console.error(error);
    //   }
    //   throw error;
    // }
  }

  private createDevice () {
    try {
      console.log('mediasoup detected devices:', mediasoupClient.detectDevice());
      const dev = new mediasoupClient.Device();
      console.log('mediasoup chosen handler:', dev.handlerName);
      return dev;
    } catch (error) {
      if (error instanceof mediasoupTypes.UnsupportedError && error.name === 'UnsupportedError') {
        console.error('browser not supported!. Cant create mediasoupDevice');
      }
      throw error;
    }
  }

  sendResponse = (msg: AnyResponse) => {
    return socketutils.sendResponse(msg);
  };

  loadMediasoupDevice = async () => {
    if (!this.routerRtpCapabilities) {
      throw new Error('routerRtpCapabilities needs to be set before loading mediasoup device');
    }
    this.mediasoupDevice = this.createDevice();
    // console.log('this from loadMediasoupDevice: ', this);
    const routerRtpCapabilities = this.routerRtpCapabilities;
    await this.mediasoupDevice.load({ routerRtpCapabilities });

    try {
      const canSendVideo = this.mediasoupDevice.canProduce('video');
      console.log('can produce video:', canSendVideo);
    } catch (err) {
      console.error(err);
    }
  };

  sendRtpCapabilities = async () => {
    if (!this.mediasoupDevice) {
      throw Error('mediasoupDevice must be loaded before sending rtpCaps');
    }
    const deviceCapabilities = this.mediasoupDevice.rtpCapabilities;
    const setRtpCapabilitiesReq = createRequest('setRtpCapabilities', deviceCapabilities);

    await socketutils.sendRequest(setRtpCapabilitiesReq);
  };

  setName = async (name: string) => {
    console.log('setting name', name);
    // return this.triggerSocketEvent('setName', name);
    // return this.socket.request('setName', { name });
    const setNameReq = createRequest('setName', { name });
    await socketutils.sendRequest(setNameReq);
  };

  setCustomClientProperties = async (props: ClientProperties) => {
    await socketutils.sendRequest(createRequest('setCustomClientProperties', props));
  };

  setCustomRoomProperties = async (roomId: string, props: RoomProperties) => {
    await socketutils.sendRequest(createRequest('setCustomRoomProperties', { roomId, properties: props }));
  };

  findGathering = async (name: string) => {
    const response = await socketutils.sendRequest(createRequest('findGatheringByName', {
      name,
    }));
    return response.data.id;
  };

  createGathering = async (gatheringName: string) => {
    const createGatheringReq = createRequest('createGathering', {
      gatheringName,
    });
    // return socket.sendRequest(createGatheringReq);
    const response = await socketutils.sendRequest(createGatheringReq);
    return response.data;
  };

  joinGathering = async (gatheringId: string) => {
    const joinGatheringReq = createRequest('joinGathering', { gatheringId });
    const response = await socketutils.sendRequest(joinGatheringReq);
    return response.data;
  };

  joinOrCreateGathering = async (gatheringName: string) => {
    try {
      const foundGatheringId = await this.findGathering(gatheringName);
      return this.joinGathering(foundGatheringId);
    } catch (e) {
      console.warn(e);
      const gathState = await this.createGathering(gatheringName);
      return this.joinGathering(gathState.gatheringId);
    }
  };

  getGatheringState = async () => {
    const getRoomsReq = createRequest('getGatheringState');
    const response = await socketutils.sendRequest(getRoomsReq);
    return response.data;
  };

  findRoom = async (roomName: string) => {
    const findReq = createRequest('findRoomByName', { roomName });
    const response = await socketutils.sendRequest(findReq);
    return response.data.id;
  };

  createRoom = async (roomName: string) => {
    const createRoomReq = createRequest('createRoom', {
      name: roomName,
    });
    const response = await socketutils.sendRequest(createRoomReq);
    return response.data;
  };

  joinRoom = async (roomId: string) => {
    const joinRoomReq = createRequest('joinRoom', { roomId });
    const response = await socketutils.sendRequest(joinRoomReq);
    return response.data;
    // this.closeAllConsumers();
    // this.roomStore.currentRoomId = roomId;
  };

  setRoomName = async (roomId: string, roomName: string) => {
    const req = createRequest('setRoomName', {
      roomId,
      roomName,
    });
    await socketutils.sendRequest(req);
  };

  requestToJoinRoom = async (roomId: string) => {
    const req = createRequest('requestToJoinRoom', { roomId });
    const response = await socketutils.sendRequest(req, 32000);
    return response.data;
  };

  joinOrCreateRoom = async (roomName: string) => {
    try {
      const roomId = await this.findRoom(roomName);
      return this.joinRoom(roomId);
    } catch (e) {
      console.warn(e);
      const roomState = await this.createRoom(roomName);
      return this.joinRoom(roomState.roomId);
    }
  };

  leaveRoom = async () => {
    const leaveRoomReq = createRequest('leaveRoom');
    await socketutils.sendRequest(leaveRoomReq);
    // this.closeAllConsumers();
  };

  removeClientFromRoom = async (clientId: string, roomId: string) => {
    const kickClientReq = createRequest('removeClientFromRoom', {
      clientId,
      roomId,
    });
    await socketutils.sendRequest(kickClientReq);
  };

  closeAllProducersForClient = async (clientId: string) => {
    const closeReq = createRequest('closeAllProducersForClient', {
      clientId,
    });
    await socketutils.sendRequest(closeReq);
  };

  pauseAllProducersForCLient = async (clientId: string) => {
    const pauseReq = createRequest('pauseAllProducersForClient', {
      clientId,
    });
    await socketutils.sendRequest(pauseReq);
  };

  setForcedMuteStateForClient = async (clientId: string, forceMuted: boolean) => {
    const req = createRequest('setForceMuteStateForClient', {
      clientId,
      forceMuted,
    });
    await socketutils.sendRequest(req);
  };

  getRouterCapabilities = async (): Promise<mediasoupTypes.RtpCapabilities> => {
    const getRouterCapsReq = createRequest('getRouterRtpCapabilities');

    const response = await socketutils.sendRequest(getRouterCapsReq);
    this.routerRtpCapabilities = response.data;
    return response.data;
  };

  createSendTransport = async () => {
    if (!this.mediasoupDevice) {
      throw Error('cant create transport if mediasoup device isnt loaded');
    }
    const createSendTransportReq = createRequest('createSendTransport');
    const response = await socketutils.sendRequest(createSendTransportReq);

    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    this.sendTransport = this.mediasoupDevice.createSendTransport(transportOptions);
    this.attachTransportEvents(this.sendTransport);
  };

  createReceiveTransport = async () => {
    if (!this.mediasoupDevice) {
      throw Error('cant create transport if mediasoup device isnt loaded');
    }
    this.receiveTransport?.close();
    const createReceiveTransportReq = createRequest('createReceiveTransport');
    const response = await socketutils.sendRequest(createReceiveTransportReq);

    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    this.receiveTransport = this.mediasoupDevice.createRecvTransport(transportOptions);
    this.attachTransportEvents(this.receiveTransport);
  };

  private attachTransportEvents = (transport: mediasoupTypes.Transport) => {
    transport.on('connect', ({ dtlsParameters }: { dtlsParameters: mediasoupTypes.DtlsParameters }, callback: () => void, errback: (error: unknown) => void) => {
      void (async () => {
        const connectTransportReq = createRequest('connectTransport', {
          transportId: transport.id,
          dtlsParameters,
        });
        const response = await socketutils.sendRequest(connectTransportReq);
        if (response.wasSuccess) {
          callback();
          return;
        }
        errback(response.message);
      })();
    });

    if (transport.direction === 'send') {
      transport.on('produce', async ({
        kind,
        rtpParameters,
        appData,
      }: TransportProduceParams, callback: ({ id }: { id: string }) => void, errorback: (error: unknown) => void) => {
        // void (async () => {
        // const params: {transportId: string | undefined, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters } = { transportId: transport?.id, kind, rtpParameters };
        try {
          const { producerInfo } = appData;
          // const response = await this.socket.request('createProducer', { transportId: transport.id, kind, rtpParameters });
          const createProducerReq = createRequest('createProducer', {
            kind,
            rtpParameters,
            transportId: transport.id,
            producerInfo,
          });
          const response = await socketutils.sendRequest(createProducerReq);
          if (response.wasSuccess) {
            const cbData = {
              id: response.data.producerId,
            };
            callback(cbData);
            return;
          }
          errorback(response.message);
        } catch (err) {
          errorback(err);
        }
        // })();
      });
    }

    transport.on('connectionstatechange', (state) => {
      console.log(`transport (${transport.id}) connection state changed to: `, state);
      switch (state) {
        case 'connecting':
          break;
        case 'connected':
          break;
        case 'failed':
          console.error('transport connectionstatechange failed');
          transport.close();
          break;
        default:
          break;
      }
    });
  };

  assignMainProducerToRoom = async (clientId: string, producerId: string, roomId: string, mediaKind: mediasoupTypes.MediaKind) => {
    const assignProducerReq = createRequest('assignMainProducerToRoom', {
      clientId, producerId, roomId, mediaKind,
    });
    await socketutils.sendRequest(assignProducerReq);
  };

  produce = async (track: MediaStreamTrack, producerInfo?: ProducerInfo): Promise<mediasoupTypes.Producer['id']> => {
    if (!this.sendTransport) {
      return Promise.reject('Need a transport to be able to produce. No transport present');
    }
    const encodings: mediasoupTypes.ProducerOptions['encodings'] = [
      {
        maxBitrate: 25_000_000,
      },
    ];
    const producerOptions: mediasoupTypes.ProducerOptions = { track, encodings };
    producerInfo = { paused: false, ...producerInfo };

    producerOptions.appData = { producerInfo };
    console.log('produce with appData:', producerOptions.appData);
    const producer = await this.sendTransport.produce(producerOptions);
    this.producers.set(producer.id, producer);
    return producer.id;
  };

  replaceProducerTrack = async (producerId: string, track: MediaStreamTrack) => {
    const producer = this.producers.get(producerId);
    if (!producer) {
      throw new Error('no producer with that id found');
    }
    console.log('replacing producer track');
    return producer.replaceTrack({ track });
  };

  consume = async (producerId: string): Promise<{ track: MediaStreamTrack, consumerId: string }> => {
    if (!producerId) {
      throw Error('consume called without producerId! Please provide one!');
    }
    if (!this.receiveTransport) {
      return Promise.reject('No receiveTransport present. Needed to be able to consume');
    }
    const createConsumerReq = createRequest('createConsumer', {
      producerId,
    });
    try {
      const response = await socketutils.sendRequest(createConsumerReq);

      const consumerOptions = response.data;
      console.log('createConsumerRequest gave these options: ', consumerOptions);
      const consumer = await this.receiveTransport.consume(consumerOptions);
      this.consumers.set(consumer.id, consumer);
      console.log('conmsumers map is: ', this.consumers);

      const setPauseReq = createRequest('notifyPauseResumeRequest', {
        objectType: 'consumer',
        objectId: consumer.id,
        wasPaused: false,
      });
      await socketutils.sendRequest(setPauseReq);

      return { track: consumer.track, consumerId: consumer.id };
    } catch (e) {
      return Promise.reject(e);
    }
  };

  pauseConsumer = (consumerId: string) => {
    this.pauseResumeConsumer(consumerId, true);
  };

  resumeConsumer = (consumerId: string) => {
    this.pauseResumeConsumer(consumerId, false);
  };

  private pauseResumeConsumer = async (consumerId: string, wasPaused: boolean) => {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('no such consumer found (client-side)');
    }
    if (wasPaused) {
      consumer.pause();
    } else {
      consumer.resume();
    }
    const pauseReq = createRequest('notifyPauseResumeRequest', {
      objectType: 'consumer',
      objectId: consumer.id,
      wasPaused,
    });
    await socketutils.sendRequest(pauseReq);
  };

  pauseProducer = (producerId: string) => {
    this.pauseResumeProducer(producerId, true);
  };

  resumeProducer = (producerId: string) => {
    this.pauseResumeProducer(producerId, false);
  };

  private pauseResumeProducer = async (producerId: string, wasPaused: boolean) => {
    const producer = this.producers.get(producerId);
    if (!producer) {
      throw Error('no such producer found (client-side)');
    }
    if (wasPaused) {
      producer.pause();
    } else {
      producer.resume();
    }
    const pauseReq = createRequest('notifyPauseResumeRequest', {
      objectType: 'producer',
      objectId: producer.id,
      wasPaused,
    });
    await socketutils.sendRequest(pauseReq);
  };

  closeAndNotifyProducer = async (producerId: string) => {
    const producer = this.producers.get(producerId);
    if (!producer) {
      throw new Error('no producer with that id! cant close it');
    }
    producer.close();
    const closeReq = createRequest('notifyCloseEventRequest', {
      objectType: 'producer',
      objectId: producerId,
    });
    socketutils.sendRequest(closeReq);
    this.producers.delete(producerId);
  };

  closeAndNotifyConsumer = async (consumerId: string) => {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('no consumer with that id! cant close it');
    }
    consumer.close();
    const closeReq = createRequest('notifyCloseEventRequest', {
      objectType: 'consumer',
      objectId: consumerId,
    });
    socketutils.sendRequest(closeReq);
    this.consumers.delete(consumerId);
  };

  closeAndNotifyAllConsumers = async () => {
    console.log('closeAllConsumers called');
    console.log('number of consumers:', this.consumers.size);
    for (const [consumerKey, consumer] of this.consumers.entries()) {
      console.log('gonna close consumer: ', consumer.id);
      consumer.close();
      const notifyCloseEventReq = createRequest('notifyCloseEventRequest', {
        objectType: 'consumer',
        objectId: consumer.id,
      });
      await socketutils.sendRequest(notifyCloseEventReq);
      this.consumers.delete(consumerKey);
    }
  };

  closeAndNotifyAllProducers = async () => {
    console.log('closeAllProducers called');
    console.log('number of producers:', this.producers.size);
    for (const [producerKey, producer] of this.producers.entries()) {
      console.log('gonna close producer: ', producer.id);
      producer.close();
      const notifyCloseEventReq = createRequest('notifyCloseEventRequest', {
        objectType: 'producer',
        objectId: producer.id,
      });
      await socketutils.sendRequest(notifyCloseEventReq);
      this.producers.delete(producerKey);
    }
  };
}
