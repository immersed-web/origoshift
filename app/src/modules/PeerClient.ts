// import { io, SocketExt } from 'socket.io-client';
// import { io } from 'socket.io-client/build/index';
// import { Socket } from 'socket.io-client/build/socket';
// import { SocketExt } from 'socket.io-client';
// import '../../socketAugmented';

import { types as mediasoupTypes } from 'mediasoup-client';
import * as mediasoupClient from 'mediasoup-client';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
// import { TransportOptions } from 'mediasoup-client/lib/Transport';
import { RoomState } from 'app/../types/types';
import { sendRequest, send, onRequest } from 'src/modules/WebSocket';
import { JoinRoom, SetName, SetRtpCapabilities } from 'app/../types/messageTypes';

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
  constructor (url?: string) {
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
    // return await this.socket.request('setRtpCapabilities', this.mediasoupDevice.rtpCapabilities);
    // TODO
    const setRtpCapabilities: SetRtpCapabilities = {
      type: 'actionRequest',
      subject: 'setRtpCapabilities',
      data: this.mediasoupDevice.rtpCapabilities,
      isResponse: false
      // id: Date.now(),
    };

    await sendRequest(setRtpCapabilities);
  }

  // const thing: mediasoupTypes.RtpCapabilities
  // createTransports() {

  // }
  // setSocket (socket: Socket) {
  //   if (this.socket.connected) {
  //     this.socket.close();
  //   }
  //   this.socket = socket;
  // }

  setName = async (name: string) => {
    console.log('setting name', name);
    // return this.triggerSocketEvent('setName', name);
    // return this.socket.request('setName', { name });
    const setNameMsg: SetName = {
      type: 'actionRequest',
      subject: 'setName',
      data: { name: name },
      isResponse: false,
    };
    return sendRequest(setNameMsg);
  }

  joinRoom = async (roomId: string) => {
    // return this.triggerSocketEvent('joinRoom', roomName);
    // return this.socket.request('joinRoom', roomName);
    const joinRoomMsg: JoinRoom = {
      type: 'actionRequest',
      subject: 'joinRoom',
      isResponse: false,
      data: {
        id: roomId
      }
    }
    return sendRequest(joinRoomMsg);
  }

  async createRoom (roomName: string) {
    // return this.triggerSocketEvent('createRoom', roomName);
    // return this.socket.request('createRoom', roomName);
    sendRequest
  }

  async getRouterCapabilities () : Promise<mediasoupTypes.RtpCapabilities> {
    const response: SocketAck = await this.socket.request('getRouterRtpCapabilities');
    if (response.status === 'success') {
      return response.data as mediasoupTypes.RtpCapabilities;
    }
    return Promise.reject(response.errorMessage);
  }

  async createSendTransport () {
    const response = await this.socket.request('createSendTransport');
    if (response.status === 'error') {
      console.error('Failed to create remote sendTransport');
      return Promise.reject(response.errorMessage);
    }
    if (!response.data) {
      return Promise.reject('No transportOptions returned from server');
    }

    const transportOptions: mediasoupTypes.TransportOptions = response.data as mediasoupTypes.TransportOptions;
    try {
      this.sendTransport = this.mediasoupDevice.createSendTransport(transportOptions);
    } catch (err) {
      // console.error('Failed to create local sendTransport');
      return Promise.reject('Failed to create local sendTransport');
    }
    this.attachTransportEvents(this.sendTransport);
  }

  async createReceiveTransport () {
    const response = await this.socket.request('createReceiveTransport');
    if (response.status === 'error') {
      return Promise.reject(response.errorMessage);
    }
    if (!response.data) {
      return Promise.reject('No transportOptions returned from server');
    }
    const transportOptions: mediasoupTypes.TransportOptions = response.data as mediasoupTypes.TransportOptions;
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
        const response = await this.socket.request('connectTransport', {
          dtlsParameters,
          id: transport?.id
        });
        if (response.status === 'success') {
          callback();
        } else {
          errback(response.errorMessage);
        }
      })();
    });

    if (transport.direction === 'send') {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      transport.on('produce', async ({
        kind,
        rtpParameters
      }: {kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters}, callback: (data: unknown) => void, errorback: (error: unknown) => void) => {
      // void (async () => {
        // const params: {transportId: string | undefined, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters } = { transportId: transport?.id, kind, rtpParameters };
        try {
          const response = await this.socket.request('createProducer', { transportId: transport.id, kind, rtpParameters });
          if (response.status === 'success') {
          // const { id } = response.data;
          // eslint-disable-next-line node/no-callback-literal
            callback(response.data);
            return;
          }
          errorback(response.errorMessage);
        } catch (err) {
          errorback(err);
        }
      // })();
      });
    }

    transport.on('connectionstatechange', (state) => {
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

  async produce (track: MediaStreamTrack): Promise<string> {
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
    const response = await this.socket.request('createConsumer', { producerId });
    if (response.status === 'error') {
      console.error(response.errorMessage);
      return Promise.reject('Failed to create remote consumer');
    }
    const consumerOptions = response.data as mediasoupTypes.ConsumerOptions;
    const consumer = await this.receiveTransport.consume(consumerOptions);
    return consumer.track;
  }
}
