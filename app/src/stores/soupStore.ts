import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { soupDevice, attachTransportEvents, type ProduceAppData } from '@/modules/mediasoup';
import type {types as soupTypes } from 'mediasoup-client';
import { computed, reactive, ref, shallowReactive, shallowRef } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useConnectionStore } from './connectionStore';
import type { ConsumerId, ProducerId, ProducerInfo } from 'schemas/mediasoup';

export const useSoupStore = defineStore('soup', () =>{
  const deviceLoaded = ref(false);
  const sendTransport = shallowRef<soupTypes.Transport>();
  const receiveTransport = shallowRef<soupTypes.Transport>();
  const producers = shallowReactive<Map<ProducerId, soupTypes.Producer>>(new Map());
  const producersStats = reactive<Record<ProducerId, Awaited<ReturnType<soupTypes.Producer['getStats']>>>>({});

  useIntervalFn(() => {
    producers.forEach(async (p, k) => {
      const stats = await p.getStats();
      producersStats[k] = stats;
    });
  }, 5000);
  // Perhaps unintuitive to have producerId as key.
  // But presumably the most common case is to need the consumer belonging to a specific producer.
  const consumers = shallowReactive<Map<ProducerId, soupTypes.Consumer>>(new Map());

  const connectionStore = useConnectionStore();

  connectionStore.client.soup.subSoupObjectClosed.subscribe(undefined, {
    onData(data) {
      // console.log('SOUP OBJECT CLOSED!!!!');
      console.log('soupObject closed: ',data);
      if(data.data.type === 'consumer'){
        const { consumerInfo: {consumerId, producerId} } = data.data;
        const con = consumers.get(producerId);
        if(con) {
          con.close();
          consumers.delete(producerId);
        }
      }
    },
    onError(err){
      console.error(err);
    },
    onComplete() {
      console.log('sub scompleted');
    },
  });

  async function loadDevice() {
    if(soupDevice.loaded){
      throw Error('mediasoup device already loaded!');
    }
    const routerRtpCapabilities = await connectionStore.client.soup.getRouterRTPCapabilities.query();
    console.log(routerRtpCapabilities);
    await soupDevice.load({ routerRtpCapabilities});
    deviceLoaded.value = soupDevice.loaded;
    connectionStore.client.soup.setRTPCapabilities.mutate({
      rtpCapabilities: soupDevice.rtpCapabilities,
    });
  }

  async function createSendTransport(){
    const transportOptions = await connectionStore.client.soup.createSendTransport.mutate();
    sendTransport.value = soupDevice.createSendTransport(transportOptions);

    attachTransportEvents<'send'>(sendTransport.value,
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

    attachTransportEvents<'recv'>(receiveTransport.value,
      async (connectData) => {
        await connectionStore.client.soup.connectTransport.mutate(connectData);
      });
  }
  async function produce({track, producerInfo, producerId}: {track: MediaStreamTrack, producerId?: ProducerId, producerInfo: ProducerInfo}){
    if(!sendTransport.value){
      throw Error('no transport. Cant produce');
    }
    const appData: ProduceAppData = {
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

  // TODO: Check if already consuming that producer and if so return that consumer
  async function consume (producerId: ProducerId) {
    if (!producerId) {
      throw Error('consume called without producerId! Please provide one!');
    }
    if (!receiveTransport.value) {
      throw Error('No receiveTransport present. Needed to be able to consume');
    }
    const foundConsumer = consumers.get(producerId);
    if(foundConsumer){
      return { track: foundConsumer.track, consumerId: foundConsumer.id as ConsumerId};
    }
    const consumerOptions = await connectionStore.client.soup.createConsumer.mutate({producerId});

    console.log('createConsumerRequest gave these options: ', consumerOptions);
    const consumer = await receiveTransport.value.consume(consumerOptions);
    //Not a bug to use producerID! It's on purpose.
    consumers.set(producerId, consumer);

    const consumerId = consumer.id as ConsumerId;
    // safe to unpause from server now
    await connectionStore.client.soup.pauseOrResumeConsumer.mutate({producerId, pause: false});

    return { track: consumer.track, consumerId};
  }

  async function consumeCurrentCamera() {
    if (!receiveTransport.value) {
      throw Error('No receiveTransport present. Needed to be able to consume');
    }
    const localConsumersResponse: Record<ProducerId, {
      track: soupTypes.Consumer['track'],
      consumerId: ConsumerId,
    }> = {};
    const consumersResponse = await connectionStore.client.soup.consumeCurrentCamera.mutate();
    for(const [key, consumerOptions] of Object.entries(consumersResponse)){
      const consumer = await receiveTransport.value.consume(consumerOptions);
      //Not a bug to use producerID! It's on purpose.
      consumers.set(consumerOptions.producerId, consumer);

      // const consumerId = consumer.id as ConsumerId;
      // safe to unpause from server now
      connectionStore.client.soup.pauseOrResumeConsumer.mutate({producerId: consumerOptions.producerId, pause: false});
      localConsumersResponse[consumerOptions.producerId] = {
        track: consumer.track,
        consumerId: consumer.id as ConsumerId,
      };
    }
    // console.log(consumers);
    return localConsumersResponse;
  }

  async function pauseConsumer (producerId: ProducerId) {
    pauseResumeConsumer(producerId, true);
  }

  async function resumeConsumer (producerId: ProducerId) {
    pauseResumeConsumer(producerId, false);
  }

  async function pauseResumeConsumer (producerId: ProducerId, wasPaused: boolean) {
    const consumer = consumers.get(producerId);
    if (!consumer) {
      throw new Error('no such consumer found (client-side)');
    }
    // const consumerId = consumer.id as ConsumerId;
    if (wasPaused) {
      consumer.pause();
    } else {
      consumer.resume();
    }
    await connectionStore.client.soup.pauseOrResumeConsumer.mutate({producerId, pause: wasPaused});
  }

  async function pauseProducer (producerId: ProducerId) {
    pauseResumeProducer(producerId, true);
  }

  async function resumeProducer (producerId: ProducerId) {
    pauseResumeProducer(producerId, false);
  }

  async function pauseResumeProducer (producerId: ProducerId, wasPaused: boolean) {
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
    deviceLoaded,
    createSendTransport,
    createReceiveTransport,
    producers,
    producersStats,
    consumers,
    produce,
    replaceProducerTrack,
    pauseProducer,
    resumeProducer,
    consume,
    consumeCurrentCamera,
    pauseConsumer,
    resumeConsumer,
  };
});
