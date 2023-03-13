import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { soupDevice, attachTransportEvents } from '@/modules/mediasoup';
import type {types as soupTypes } from 'mediasoup-client';
import { ref, shallowReactive, shallowRef } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { ConsumerId, ProducerId, ProducerInfo } from 'schemas/mediasoup';

export const useSoupStroe = defineStore('soup', () =>{
  const deviceLoaded = ref(false);
  const sendTransport = shallowRef<soupTypes.Transport>();
  const receiveTransport = shallowRef<soupTypes.Transport>();
  const producers = shallowReactive<Map<ProducerId, soupTypes.Producer>>(new Map());
  const consumers = shallowReactive<Map<ConsumerId, soupTypes.Consumer>>(new Map());

  const connectionStore = useConnectionStore();

  connectionStore.client.soup.subSoupObjectClosed.subscribe(undefined, {
    onData(data) {
      console.log(data);
    },
  });

  async function loadDevice() {
    if(!soupDevice.loaded){
      const routerRtpCapabilities = await connectionStore.client.soup.getRouterRTPCapabilities.query();
      console.log(routerRtpCapabilities);
      await soupDevice.load({ routerRtpCapabilities});
    }
    deviceLoaded.value = soupDevice.loaded;
    connectionStore.client.soup.setRTPCapabilities.mutate({
      rtpCapabilities: soupDevice.rtpCapabilities,
    });
  }

  async function createSendTransport(){
    const transportOptions = await connectionStore.client.soup.createSendTransport.mutate();
    sendTransport.value = soupDevice.createSendTransport(transportOptions);

    attachTransportEvents(sendTransport.value,
      async (connectData) => {
        await connectionStore.client.soup.connectTransport.mutate(connectData);
      },
      async (produceData) => {
        const producerId = await connectionStore.client.soup.createProducer.mutate(produceData);
        return producerId as ProducerId;
      });
  }

  async function createReceiveTransport(){
    const transportOptions = await connectionStore.client.soup.createReceiveTransport.mutate();
    receiveTransport.value = soupDevice.createRecvTransport(transportOptions);

    attachTransportEvents(receiveTransport.value,
      async (connectData) => {
        await connectionStore.client.soup.connectTransport.mutate(connectData);
      },
      (_ignoredArgs) => {
        return Promise.resolve('DUMMY DATA. THIS SHOULD NEVER BE CALLED' as ProducerId);
      });
  }
  async function produce({track, producerInfo, producerId}: {track: MediaStreamTrack, producerId?: ProducerId, producerInfo: ProducerInfo}){
    if(!sendTransport.value){
      throw Error('no transport. Cant produce');
    }
    const appData = {
      producerInfo,
      producerId,
    };
    const producer = await sendTransport.value.produce({
      track,
      encodings: [{
        maxBitrate: 25_000_000,
      }],
      appData,
    });
    producers.set(producer.id as ProducerId, producer);
    return producer.id as ProducerId;
  }


  async function replaceProducerTrack (producerId: ProducerId, track: MediaStreamTrack) {
    const producer = producers.get(producerId);
    if (!producer) {
      throw new Error('no producer with that id found');
    }
    console.log('replacing producer track');
    return producer.replaceTrack({ track });
  }

  // async function consume (producerId: string) {
  //   if (!producerId) {
  //     throw Error('consume called without producerId! Please provide one!');
  //   }
  //   if (!receiveTransport.value) {
  //     return Promise.reject('No receiveTransport present. Needed to be able to consume');
  //   }
  //   // const createConsumerReq = createRequest('createConsumer', {
  //   //   producerId,
  //   // });
  //   try {
  //     // const response = await socketutils.sendRequest(createConsumerReq);
  //     const response = await connectionStore.client.soup.createConsumer({producerId});

  //     const consumerOptions = response.data;
  //     console.log('createConsumerRequest gave these options: ', consumerOptions);
  //     const consumer = await receiveTransport.value.consume(consumerOptions);
  //     consumers.set(consumer.id, consumer);
  //     console.log('conmsumers map is: ', consumers);

  //     // const setPauseReq = createRequest('notifyPauseResumeRequest', {
  //     //   objectType: 'consumer',
  //     //   objectId: consumer.id,
  //     //   wasPaused: false,
  //     // });
  //     // await socketutils.sendRequest(setPauseReq);

  //     return { track: consumer.track, consumerId: consumer.id as ConsumerId };
  //   } catch (e) {
  //     return Promise.reject(e);
  //   }
  // }

  async function pauseConsumer (consumerId: string) {
    pauseResumeConsumer(consumerId, true);
  }

  async function resumeConsumer (consumerId: string) {
    pauseResumeConsumer(consumerId, false);
  }

  async function pauseResumeConsumer (consumerId: string, wasPaused: boolean) {
    const consumer = consumers.get(consumerId);
    if (!consumer) {
      throw new Error('no such consumer found (client-side)');
    }
    if (wasPaused) {
      consumer.pause();
    } else {
      consumer.resume();
    }
    //TODO: Implement
    // const pauseReq = createRequest('notifyPauseResumeRequest', {
    //   objectType: 'consumer',
    //   objectId: consumer.id,
    //   wasPaused,
    // });
    // await socketutils.sendRequest(pauseReq);
  }

  async function pauseProducer (producerId: string) {
    pauseResumeProducer(producerId, true);
  }

  async function resumeProducer (producerId: string) {
    pauseResumeProducer(producerId, false);
  }

  async function pauseResumeProducer (producerId: string, wasPaused: boolean) {
    const producer = producers.get(producerId);
    if (!producer) {
      throw Error('no such producer found (client-side)');
    }
    if (wasPaused) {
      producer.pause();
    } else {
      producer.resume();
    }
    // TODO: Implement
    // const pauseReq = createRequest('notifyPauseResumeRequest', {
    //   objectType: 'producer',
    //   objectId: producer.id,
    //   wasPaused,
    // });
    // await socketutils.sendRequest(pauseReq);
  }

  return {
    loadDevice,
    createSendTransport,
    createReceiveTransport,
    producers,
    consumers,
    produce,
    replaceProducerTrack,
    pauseProducer,
    resumeProducer,
    // consume,
    pauseConsumer,
    resumeConsumer,
  };
});
