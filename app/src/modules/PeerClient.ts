// import { io, SocketExt } from 'socket.io-client';
// import { io } from 'socket.io-client/build/index';
// import { Socket } from 'socket.io-client/build/socket';
// import { SocketExt } from 'socket.io-client';
// import '../../socketAugmented';

import { types as mediasoupTypes } from 'mediasoup-client';
import * as mediasoupClient from 'mediasoup-client';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
// import { TransportOptions } from 'mediasoup-client/lib/Transport';
// import { RoomState } from 'app/../types/types';
import { sendRequest, onSocketReceivedMessage } from 'src/modules/WebSocket';
import { createRequest, Request } from 'shared-types/MessageTypes';

export default class PeerClient {
  // socket: SocketExt;
  id = '';
  url?: string;
  mediasoupDevice!: mediasoupTypes.Device;
  sendTransport?: mediasoupTypes.Transport;
  receiveTransport?: mediasoupTypes.Transport;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
  // onRoomState?: (data: RoomState) => void;

  // constructor (url?: string, onRoomState?: (data: RoomState) => void) {
  constructor () {
    this.producers = new Map<string, mediasoupTypes.Producer>();
    this.consumers = new Map<string, mediasoupTypes.Consumer>();
    // this.onRoomState = onRoomState;

    // this.socket.on('connect', () => {
    //   console.log('peer socket connected: ', this.socket.id);
    //   // TODO: decouple peer id from socket id.
    //   console.log('setting peer id to same as socket id: ', this.socket.id);
    //   this.id = this.socket.id;
    // });

    // this.socket.on('disconnect', (reason) => {
    //   console.error(`peer socket disconnected: ${reason}`);
    // });

    // this.socket.on('roomState', (data: RoomState) => {
    //   console.log('roomState updated:', data);
    //   if (this.onRoomState) {
    //     this.onRoomState(data);
    //   }
    // });

    onSocketReceivedMessage((msg) => {
      if (msg.subject === 'roomState') {
        // this.consumers = msg.data.consumers;
        console.log('received new roomstate', msg.data);
      }
    });

    // Wanted to add it to the "Socket class" prototype but that doesn't seem to work. I think it might be the case that the io-function doesn't return a Socket class instance
    // this.socket.request = (ev: string, ...data: unknown[]) => {
    //   return new Promise((resolve) => {
    //     this.socket.emit(ev, ...data, resolve);
    //   });
    // };

    try {
      this.mediasoupDevice = new mediasoupClient.Device();
    } catch (error) {
      if (error instanceof mediasoupTypes.UnsupportedError && error.name === 'UnsupportedError') {
        console.warn('browser not supported');
      } else {
        console.error(error);
      }
    }
  }

  async awaitConnection (): Promise<void> {
    return new Promise((resolve) => {
      // return this.socket.once('connect', () => resolve());
      // TODO
      resolve();
    });
  }

  async loadMediasoupDevice (rtpCapabilities: RtpCapabilities) {
    await this.mediasoupDevice.load({ routerRtpCapabilities: rtpCapabilities });

    try {
      const canSendVideo = this.mediasoupDevice.canProduce('video');
      console.log('can produce video:', canSendVideo);
    } catch (err) {
      console.error(err);
    }
  }

  async sendRtpCapabilities () {
    const deviceCapabilities = this.mediasoupDevice.rtpCapabilities;
    const setRtpCapabilitiesReq = createRequest<'setRtpCapabilities'>('setRtpCapabilities', deviceCapabilities);

    const response = await sendRequest<'setRtpCapabilities'>(setRtpCapabilitiesReq);
    return response.wasSuccess;
  }

  async setName (name: string) {
    console.log('setting name', name);
    // return this.triggerSocketEvent('setName', name);
    // return this.socket.request('setName', { name });
    const setNameReq: Request<'setName'> = createRequest<'setName'>('setName', { name: name });
    const response = await sendRequest<'setName'>(setNameReq);
    return response.wasSuccess;
  }

  async createGathering (gatheringName: string) {
    const createGatheringReq = createRequest<'createGathering'>('createGathering', {
      gatheringName: gatheringName,
    });
    return sendRequest(createGatheringReq);
  }

  async getRooms () {
    const getRoomsReq = createRequest<'getRooms'>('getRooms');
    const response = await sendRequest<'getRooms'>(getRoomsReq);
    if (!response.wasSuccess) {
      throw new Error(response.message);
    }
    return response.data;
  }

  async createRoom (roomName: string) {
    const createRoomReq: Request<'createRoom'> = createRequest<'createRoom'>('createRoom', {
      name: roomName,
    });
    const response = await sendRequest<'createRoom'>(createRoomReq);
    if (!response.wasSuccess) {
      throw new Error(response.message);
    }
    return response.data.roomId;
  }

  async joinRoom (roomId: string) {
    const joinRoomReq: Request<'joinRoom'> = createRequest<'joinRoom'>('joinRoom', { roomId: roomId });
    const response = await sendRequest<'joinRoom'>(joinRoomReq);
    return response.wasSuccess;
  }

  async getRouterCapabilities () : Promise<mediasoupTypes.RtpCapabilities> {
    const getRouterCapsReq: Request<'getRouterRtpCapabilities'> = createRequest<'getRouterRtpCapabilities'>('getRouterRtpCapabilities');

    const response = await sendRequest<'getRouterRtpCapabilities'>(getRouterCapsReq);
    if (response.wasSuccess) {
      return response.data;
    } else {
      console.error(response.message);
    }

    throw new Error('failed to get router caps!');
  }

  async createSendTransport () {
    const createSendTransportReq: Request<'createSendTransport'> = createRequest<'createSendTransport'>('createSendTransport');
    const response = await sendRequest<'createSendTransport'>(createSendTransportReq);

    if (!response.wasSuccess) {
      throw response.message;
    }
    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    try {
      this.sendTransport = this.mediasoupDevice.createSendTransport(transportOptions);
    } catch (err) {
      return Promise.reject('Failed to create local sendTransport');
    }
    this.attachTransportEvents(this.sendTransport);
  }

  async createReceiveTransport () {
    const createReceiveTransportReq = createRequest<'createReceiveTransport'>('createReceiveTransport');
    const response = await sendRequest<'createReceiveTransport'>(createReceiveTransportReq);

    if (!response.wasSuccess) {
      throw response.message;
    }
    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    try {
      this.receiveTransport = this.mediasoupDevice.createRecvTransport(transportOptions);
    } catch (err) {
      return Promise.reject('Failed to create local receiveTransport');
    }
    this.attachTransportEvents(this.receiveTransport);
  }

  attachTransportEvents (transport: mediasoupTypes.Transport) {
    transport.on('connect', ({ dtlsParameters }: {dtlsParameters: mediasoupTypes.DtlsParameters}, callback: () => void, errback: (error: unknown) => void) => {
      void (async () => {
        const connectTransportReq = createRequest<'connectTransport'>('connectTransport', {
          transportId: transport.id,
          dtlsParameters,
        });
        const response = await sendRequest(connectTransportReq);
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
      }: {kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters}, callback: (data: unknown) => void, errorback: (error: unknown) => void) => {
      // void (async () => {
        // const params: {transportId: string | undefined, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters } = { transportId: transport?.id, kind, rtpParameters };
        try {
          // const response = await this.socket.request('createProducer', { transportId: transport.id, kind, rtpParameters });
          const createProducerReq = createRequest<'createProducer'>('createProducer', {
            kind,
            rtpParameters,
            transportId: transport.id,
          });
          const response = await sendRequest<'createProducer'>(createProducerReq);
          if (response.wasSuccess) {
            callback(response.data);
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
        // localVideo.srcObject = stream
          break;
        case 'failed':
          console.error('transport connectionstatechange failed');
          transport.close();
          break;
        default:
          break;
      }
    });
  }

  async produce (track: MediaStreamTrack): Promise<mediasoupTypes.Producer['id']> {
    if (!this.sendTransport) {
      return Promise.reject('Need a transport to be able to produce. No transport present');
    }
    const producer = await this.sendTransport.produce({ track });
    this.producers.set(producer.id, producer);
    return producer.id;
  }

  async consume (producerId: string): Promise<MediaStreamTrack> {
    if (!this.receiveTransport) {
      return Promise.reject('No receiveTransport present. Needed to be able to consume');
    }
    // const response = await this.socket.request('createConsumer', { producerId });
    // if (response.status === 'error') {
    //   console.error(response.errorMessage);
    //   return Promise.reject('Failed to create remote consumer');
    // }
    // const createConsumerMsg: CreateConsumer = {
    //   subject: 'createConsumer',
    //   type: 'request',
    //   data: {
    //     producerId,
    //   },
    //   isResponse: false,
    // };
    const createConsumerReq = createRequest<'createConsumer'>('createConsumer', {
      producerId: producerId,
    });
    const response = await sendRequest<'createConsumer'>(createConsumerReq);

    if (!response.wasSuccess) {
      throw response.message;
    }

    try {
      const consumerOptions = response.data;
      const consumer = await this.receiveTransport.consume(consumerOptions);
      return consumer.track;
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
