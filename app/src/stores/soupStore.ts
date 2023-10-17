import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { soupDevice, attachTransportEvents, type ProduceAppData } from '@/modules/mediasoup';
import type {types as soupTypes } from 'mediasoup-client';
import { computed, reactive, ref, shallowReactive, shallowRef, toRaw } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useConnectionStore } from './connectionStore';
import type { ConsumerId, ProducerId, ProducerInfo } from 'schemas/mediasoup';

type ProducerData = {
  producer?: soupTypes.Producer,
  stats?: Awaited<ReturnType<soupTypes.Producer['getStats']>> | undefined,
}
export const useSoupStore = defineStore('soup', () =>{
  const deviceLoaded = ref(false);
  const sendTransport = shallowRef<soupTypes.Transport>();
  const receiveTransport = shallowRef<soupTypes.Transport>();
  const userHasInteracted = ref(false);
  // const producers = shallowReactive<Map<ProducerId, soupTypes.Producer>>(new Map());
  const videoProducer: ProducerData = reactive({
    producer: undefined,
    stats: undefined,
  });
  const audioProducer: ProducerData = reactive({
    producer: undefined,
    stats: undefined,
  });
  // const producersStats = reactive<Record<ProducerId, >>({});

  useIntervalFn(async () => {
    if(videoProducer.producer){
      videoProducer.stats = await videoProducer.producer.getStats();
    }
    if(audioProducer.producer){
      audioProducer.stats = await audioProducer.producer.getStats();
    }
    consumers.forEach(async (c, k) => consumerStats.set(k, await c.getStats()));
    // producers.forEach(async (p, k) => {
    //   const stats = await p.getStats();
    //   producersStats[k] = stats;
    // });
    // console.dir(toRaw(consumerStats));
  }, 5000);

  // Perhaps unintuitive to have producerId as key.
  // But presumably the most common case is to need the consumer belonging to a specific producer.
  const consumers = shallowReactive<Map<ProducerId, soupTypes.Consumer>>(new Map());
  const consumerStats = shallowReactive<Map<ProducerId, RTCStatsReport>>(new Map());

  const connectionStore = useConnectionStore();

  connectionStore.client.soup.subSoupObjectClosed.subscribe(undefined, {
    onData({data, reason}) {
      console.log(`soupObject closed (${reason}): `, data);
      switch (data.type){
        case 'consumer': {
          const { consumerInfo: {consumerId, producerId} } = data;
          const con = consumers.get(producerId);
          if(con) {
            con.close();
            consumers.delete(producerId);
            consumerStats.delete(producerId);
          }
          break;
        }
        case 'producer': {
          if(videoProducer.producer?.id === data.id){
            videoProducer.producer.close();
            videoProducer.producer = undefined;
            videoProducer.stats = undefined;
          } else if(audioProducer.producer?.id === data.id){
            audioProducer.producer.close();
            audioProducer.producer = undefined;
            audioProducer.stats = undefined;
          }
          break;
        }
        case 'transport': {
          if(sendTransport.value?.id === data.id){
            sendTransport.value?.close();
            sendTransport.value = undefined;
          } else if(receiveTransport.value?.id === data.id){
            receiveTransport.value?.close();
            receiveTransport.value = undefined;
          }
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

  //TODO: implement this. It will be needed if user jumps betweeen events.
  // Every event has separate medisoup router and each router needs separate client side device (I think)
  async function unloadDevice(){
  }

  async function createSendTransport(){
    if(sendTransport.value){
      // throw Error('local sendTransport already exists. Wont create a new one!');
      console.warn('local sendTransport already exists. Wont create a new one!');
      return;
    }
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
    if(receiveTransport.value){
      // throw Error('local receiveTransport already exists. Wont create a new one!');
      console.warn('local receiveTransport already exists. Wont create a new one!');
      return;
    }
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
    if(track.kind === 'video' && videoProducer.producer){
      closeVideoProducer();
    } else if(track.kind === 'audio' && audioProducer.producer) {
      closeAudioProducer();
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
    if(producer.kind === 'video'){
      videoProducer.producer = producer;
    } else {
      audioProducer.producer = producer;
    }
    return producer.id as ProducerId;
  }

  async function closeVideoProducer(){
    if(!videoProducer.producer){
      console.warn('tried to close videoProducer, but no videoProducer existed');
      return;
    }
    videoProducer.producer.close();
    videoProducer.producer = undefined;
    videoProducer.stats = undefined;
    connectionStore.client.soup.closeVideoProducer.mutate();
  }

  async function closeAudioProducer(){
    if(!audioProducer.producer){
      console.warn('tried to close audioProducer, but no audioProducer existed');
      return;
    }
    audioProducer.producer.close();
    audioProducer.producer = undefined;
    audioProducer.stats = undefined;
    connectionStore.client.soup.closeAudioProducer.mutate();
  }

  async function replaceVideoProducerTrack (track: MediaStreamTrack) {
    if(track.kind !== 'video'){
      throw Error('the new track must be of kind video');
    }
    // const producer = producers.get(producerId);
    if (!videoProducer.producer) {
      throw new Error('no videoProducer exists, can\'t replace track');
    }
    console.log('replacing producer track');
    return videoProducer.producer.replaceTrack({ track });
  }

  async function replaceAudioProducerTrack (track: MediaStreamTrack) {
    if(track.kind !== 'audio'){
      throw Error('the new track must be of kind video');
    }
    // const producer = producers.get(producerId);
    if (!audioProducer.producer) {
      throw new Error('no audioProducer exists, can\'t replace track');
    }
    console.log('replacing producer track');
    return audioProducer.producer.replaceTrack({ track });
  }

  async function consume (producerId: ProducerId) {
    if (!producerId) {
      throw Error('consume called without producerId! Please provide one!');
    }
    // if (!receiveTransport.value) {
    //   throw Error('No receiveTransport present. Needed to be able to consume');
    // }
    const foundConsumer = consumers.get(producerId);
    if(foundConsumer){
      console.log('re-using already existing consumer');
      return { track: foundConsumer.track, consumerId: foundConsumer.id as ConsumerId};
    }
    const consumerOptions = await connectionStore.client.soup.createConsumer.mutate({producerId});

    return await _handleReceivedConsumerOptions(consumerOptions);
    // console.log('createConsumerRequest gave these options: ', consumerOptions);
    // const consumer = await receiveTransport.value.consume(consumerOptions);
    // //Not a bug to use producerID! It's on purpose.
    // consumers.set(producerId, consumer);

    // const consumerId = consumer.id as ConsumerId;
    // // safe to unpause from server now
    // await connectionStore.client.soup.pauseOrResumeConsumer.mutate({producerId, pause: false});

    // return { track: consumer.track, consumerId};
  }

  async function _handleReceivedConsumerOptions(consumerOptions: RouterOutputs['soup']['createConsumer']){
    if (!receiveTransport.value) {
      throw Error('No receiveTransport present. Needed to be able to consume');
    }
    if(consumerOptions.alreadyExisted){
      console.log('consumer already existed in backend. Will try to keep using it');
      const foundConsumer = consumers.get(consumerOptions.producerId);
      if(foundConsumer){
        console.log('consumer also already existed in frontend. Will keep it');
        return {
          track: foundConsumer.track,
          consumerId: foundConsumer.id as ConsumerId,
        };
      }
      console.error('consumer existed in backend but not in frontend. Not good!');
    }
    const consumer = await receiveTransport.value.consume(consumerOptions);
    console.assert(!consumers.has(consumerOptions.producerId), 'a new consumer was created in backend but one for that producer already existed in frontend. This is REEEEAAAAL BAAAD. What have you done Gunhaxxor?');
    consumers.set(consumerOptions.producerId, consumer);

    // safe to unpause from server now
    connectionStore.client.soup.pauseOrResumeConsumer.mutate({producerId: consumerOptions.producerId, pause: false});
    return {
      track: consumer.track,
      consumerId: consumer.id as ConsumerId,
    };
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

  async function pauseVideoProducer () {
    pauseResumeProducer('video', true);
  }

  async function resumeVideoProducer () {
    pauseResumeProducer('video', false);
  }

  async function pauseAudioProducer () {
    pauseResumeProducer('audio', true);
  }

  async function resumeAudioProducer () {
    pauseResumeProducer('audio', false);
  }

  async function pauseResumeProducer (type: 'video' | 'audio', wasPaused: boolean) {
    let producer: soupTypes.Producer | undefined;
    if(type === 'video'){
      producer = videoProducer.producer;
    } else {
      producer = audioProducer.producer;
    }
    // const producer = producers.get(producerId);
    if (!producer) {
      throw Error('no such producer exists (client-side)');
    }
    if (wasPaused) {
      producer.pause();
    } else {
      producer.resume();
    }
    // TODO: signal changed pause state to backend
    // const pauseReq = createRequest('notifyPauseResumeRequest', {
    //   objectType: 'producer',
    //   objectId: producer.id,
    //   wasPaused,
    // });
    // await socketutils.sendRequest(pauseReq);
  }

  return {
    userHasInteracted,
    loadDevice,
    deviceLoaded,
    createSendTransport,
    createReceiveTransport,
    videoProducer,
    audioProducer,
    // producers,
    // producersStats,
    consumers,
    consumerStats,
    produce,
    replaceVideoProducerTrack,
    replaceAudioProducerTrack,
    pauseVideoProducer,
    resumeVideoProducer,
    pauseAudioProducer,
    resumeAudioProducer,
    consume,
    pauseConsumer,
    resumeConsumer,
  };
});
