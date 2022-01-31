// import { io, SocketExt } from 'socket.io-client';
// import { io } from 'socket.io-client/build/index';
// import { Socket } from 'socket.io-client/build/socket';
// import { SocketExt } from 'socket.io-client';
// import '../../socketAugmented';

import { types as mediasoupTypes } from 'mediasoup-client';
import * as mediasoupClient from 'mediasoup-client';
// import { RoomState } from 'app/../types/types';
import { createSocket, sendRequest, onSocketReceivedReqOrMsg } from 'src/modules/webSocket';
import { AnyMessage, AnyRequest, createRequest } from 'shared-types/MessageTypes';
// import { pinia } from 'src/boot/pinia';
// import { useRoomStore } from 'src/stores/roomStore';

type consumerClosedCallback = (consumerId: string) => unknown;
export default class PeerClient {
  // socket: SocketExt;
  id = '';
  url?: string;
  mediasoupDevice: mediasoupTypes.Device;
  sendTransport?: mediasoupTypes.Transport;
  receiveTransport?: mediasoupTypes.Transport;
  producers = new Map<string, mediasoupTypes.Producer>();
  consumers = new Map<string, mediasoupTypes.Consumer>();
  routerRtpCapabilities?: mediasoupTypes.RtpCapabilities;

  onRequestCallback? = undefined as unknown as (msg: AnyRequest) => unknown;
  onMessageCallback? = undefined as unknown as (msg: AnyMessage) => unknown;
  onConsumerClosed?: consumerClosedCallback = undefined; // INFO for some reason I can't declare this function type inline. So i declared above ^

  connect = (token: string) => {
    return createSocket(token);
  }

  constructor () {
    onSocketReceivedReqOrMsg((msg) => {
      // console.log(msg);
      if (msg.type === 'message') {
        switch (msg.subject) {
          case 'notifyCloseEvent': {
            switch (msg.data.objectType) {
              case 'consumer': {
                // this.close;
                const consumer = this.consumers.get(msg.data.objectId);
                if (!consumer) {
                  throw Error(`no consumer with that id found in client: ${msg.data.objectId}`);
                }
                consumer.close();
                if (this.onConsumerClosed) {
                  this.onConsumerClosed(consumer.id);
                }
              }
            }
            break;
          }
          default: {
            if (this.onMessageCallback) {
              this.onMessageCallback(msg);
            }
          }
        }
      } else {
        // if (msg.subject === 'roomStateUpdated') {
        //   // this.consumers = msg.data.consumers;
        //   console.log('received new roomstate', msg.data);
        // }
        if (this.onRequestCallback) {
          this.onRequestCallback(msg);
        }
      }
    });

    try {
      this.mediasoupDevice = this.createDevice();
    } catch (error) {
      if (error instanceof mediasoupTypes.UnsupportedError && error.name === 'UnsupportedError') {
        console.warn('browser not supported');
      } else {
        console.error(error);
      }
      throw error;
    }
  }

  private createDevice () {
    return new mediasoupClient.Device();
  }

  // async awaitConnection (): Promise<void> {
  //   return new Promise((resolve) => {
  //     // return this.socket.once('connect', () => resolve());
  //     // TODO
  //     resolve();
  //   });
  // }

  loadMediasoupDevice = async () => {
    console.log('this from loadMediasoupDevice: ', this);
    if (!this.routerRtpCapabilities) {
      throw new Error('routerRtpCapabilities needs to be set before loading mediasoup device');
    }
    // this.createDevice();
    const routerRtpCapabilities = this.routerRtpCapabilities;
    await this.mediasoupDevice.load({ routerRtpCapabilities });

    try {
      const canSendVideo = this.mediasoupDevice.canProduce('video');
      console.log('can produce video:', canSendVideo);
    } catch (err) {
      console.error(err);
    }
  }

  sendRtpCapabilities = async () => {
    if (!this.mediasoupDevice) {
      throw Error('mediasoupDevice must be loaded before sending rtpCaps');
    }
    const deviceCapabilities = this.mediasoupDevice.rtpCapabilities;
    const setRtpCapabilitiesReq = createRequest('setRtpCapabilities', deviceCapabilities);

    await sendRequest(setRtpCapabilitiesReq);
  }

  setName = async (name: string) => {
    console.log('setting name', name);
    // return this.triggerSocketEvent('setName', name);
    // return this.socket.request('setName', { name });
    const setNameReq = createRequest('setName', { name: name });
    await sendRequest(setNameReq);
  }

  findGathering = async (name: string) => {
    const response = await sendRequest(createRequest('findGatheringByName', {
      name: name,
    }));
    return response.data;
  }

  createGathering = async (gatheringName: string) => {
    const createGatheringReq = createRequest('createGathering', {
      gatheringName: gatheringName,
    });
    // return sendRequest(createGatheringReq);
    const response = await sendRequest(createGatheringReq);
    return response.data.gatheringId;
  }

  joinGathering = async (gatheringId: string) => {
    const joinGatheringReq = createRequest('joinGathering', { gatheringId });
    await sendRequest(joinGatheringReq);
    // if(!response.wasSuccess){
    //   throw new Error(response.message);
    // }
    // return response.
  }

   getGatheringState = async () => {
     const getRoomsReq = createRequest('getGatheringState');
     const response = await sendRequest(getRoomsReq);
     return response.data;
   }

   createRoom = async (roomName: string) => {
     const createRoomReq = createRequest('createRoom', {
       name: roomName,
     });
     const response = await sendRequest(createRoomReq);
     return response.data.roomId;
   }

   joinRoom = async (roomId: string) => {
     const joinRoomReq = createRequest('joinRoom', { roomId: roomId });
     await sendRequest(joinRoomReq);
     // this.closeAllConsumers();
     // this.roomStore.currentRoomId = roomId;
   }

  leaveRoom = async () => {
    const leaveRoomReq = createRequest('leaveRoom');
    await sendRequest(leaveRoomReq);
    // this.closeAllConsumers();
  }

  getRouterCapabilities = async (): Promise<mediasoupTypes.RtpCapabilities> => {
    const getRouterCapsReq = createRequest('getRouterRtpCapabilities');

    const response = await sendRequest(getRouterCapsReq);
    this.routerRtpCapabilities = response.data;
    return response.data;
  }

  createSendTransport = async () => {
    if (!this.mediasoupDevice) {
      throw Error('cant create transport if mediasoup device isnt loaded');
    }
    const createSendTransportReq = createRequest('createSendTransport');
    const response = await sendRequest(createSendTransportReq);

    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    this.sendTransport = this.mediasoupDevice.createSendTransport(transportOptions);
    this.attachTransportEvents(this.sendTransport);
  }

  createReceiveTransport = async () => {
    if (!this.mediasoupDevice) {
      throw Error('cant create transport if mediasoup device isnt loaded');
    }
    const createReceiveTransportReq = createRequest('createReceiveTransport');
    const response = await sendRequest(createReceiveTransportReq);

    const transportOptions: mediasoupTypes.TransportOptions = response.data;
    this.receiveTransport = this.mediasoupDevice.createRecvTransport(transportOptions);
    this.attachTransportEvents(this.receiveTransport);
  }

  attachTransportEvents = (transport: mediasoupTypes.Transport) => {
    transport.on('connect', ({ dtlsParameters }: {dtlsParameters: mediasoupTypes.DtlsParameters}, callback: () => void, errback: (error: unknown) => void) => {
      void (async () => {
        const connectTransportReq = createRequest('connectTransport', {
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
          const createProducerReq = createRequest('createProducer', {
            kind,
            rtpParameters,
            transportId: transport.id,
          });
          const response = await sendRequest(createProducerReq);
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

  produce = async (track: MediaStreamTrack): Promise<mediasoupTypes.Producer['id']> => {
    if (!this.sendTransport) {
      return Promise.reject('Need a transport to be able to produce. No transport present');
    }
    const producer = await this.sendTransport.produce({ track });
    this.producers.set(producer.id, producer);
    return producer.id;
  }

  consume = async (producerId: string): Promise<{track: MediaStreamTrack, consumerId: string}> => {
    if (!producerId) {
      throw Error('consume called without producerId! Please provide one!');
    }
    if (!this.receiveTransport) {
      return Promise.reject('No receiveTransport present. Needed to be able to consume');
    }
    const createConsumerReq = createRequest('createConsumer', {
      producerId: producerId,
    });
    try {
      const response = await sendRequest(createConsumerReq);

      const consumerOptions = response.data;
      const consumer = await this.receiveTransport.consume(consumerOptions);
      this.consumers.set(consumer.id, consumer);

      const setPauseReq = createRequest('notifyPauseResume', {
        objectType: 'consumer',
        objectId: consumer.id,
        wasPaused: false,
      });
      await sendRequest(setPauseReq);

      return { track: consumer.track, consumerId: consumer.id };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  pauseConsumer = (consumerId: string) => {
    this.pauseResumeConsumer(consumerId, true);
  }

  resumeConsumer = (consumerId: string) => {
    this.pauseResumeConsumer(consumerId, false);
  }

  // TODO: eventually we might also need pause/resume for client-side producers
  private pauseResumeConsumer = async (consumerId: string, wasPaused: boolean) => {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('no such consumer found (client-side)');
    }
    const pauseReq = createRequest('notifyPauseResume', {
      objectType: 'consumer',
      objectId: consumer.id,
      wasPaused: wasPaused,
    });
    await sendRequest(pauseReq);
  }

  closeAllConsumers = async () => {
    console.log('closeAllConsumers called');
    console.log('number of consumers:', this.consumers.size);
    for (const [consumerKey, consumer] of this.consumers.entries()) {
      console.log('gonna close consumer: ', consumer.id);
      consumer.close();
      const notifyCloseEventReq = createRequest('notifyCloseEvent', {
        objectType: 'consumer',
        objectId: consumer.id,
      });
      await sendRequest(notifyCloseEventReq);
      this.consumers.delete(consumerKey);
    }
  }
}
