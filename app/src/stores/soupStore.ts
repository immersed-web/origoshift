import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { soupDevice, attachTransportEvents, type ProduceAppData } from '@/modules/mediasoup';
import type {types as soupTypes } from 'mediasoup-client';
import { reactive, ref, shallowReactive, shallowRef } from 'vue';
import { useIntervalFn, useEventListener } from '@vueuse/core';
import { useConnectionStore } from './connectionStore';
import type { ConsumerId, ProducerId, ProducerInfo } from 'schemas/mediasoup';

type QualityLimitationReason = 'cpu' | 'bandwidth' | 'none' | 'other';
// Seems like dom.lib.d.ts once again misses som definitions (perhaps they are not standardized yet?)
type ExtendedRTCOutboundStreamStats = RTCOutboundRtpStreamStats & { qualityLimitationReason?: QualityLimitationReason, qualityLimitationDurations?: Record<QualityLimitationReason, number>, encoderImplementation?: string};
type ProducerStats = {outgoingBitrate?: number} & Pick<ExtendedRTCOutboundStreamStats,
'timestamp'
|'bytesSent'
|'frameWidth'
|'frameHeight'
|'framesPerSecond'
|'qualityLimitationReason'
|'qualityLimitationDurations'
|'targetBitrate'
|'encoderImplementation'
>
& Pick<RTCIceCandidatePairStats, 'availableOutgoingBitrate'>;

type ConsumerStats = {incomingBitrate?: number} & Pick<RTCInboundRtpStreamStats, 
'timestamp'
|'bytesReceived'
|'frameWidth'
|'frameHeight'
|'framesPerSecond'
>

type ProducerData = {
  producer?: soupTypes.Producer,
  stats?: ProducerStats | undefined,
  _prevStats?: ProducerStats | undefined,
}

function calculateBitRate(prevStamp: number, stamp: number, prevBytes?: number, bytes?: number){
  if(!prevBytes || !bytes) return undefined;
  const deltaBytes = bytes - prevBytes;
  const deltaTimeS = (stamp - prevStamp) * 0.001;
  const bitrate = 8 * deltaBytes / deltaTimeS;
  // console.log('calc bitrate:', deltaBytes, deltaTimeS);
  return Math.floor(bitrate);
}
function pick<O extends {}, K extends keyof O>(obj: O, arr: Array<K>){
  return arr.reduce((acc, curr) => {
    acc[curr] = obj[curr];
    return acc;
  },
  {} as Partial<Pick<O, K>>) as Pick<O,K>;
}
function extractProducersStats(newRtcStats: RTCStatsReport, prevProducerStats?: ProducerStats) {
  const newProducerState: ProducerStats = {timestamp: 0};
  for(const report of Array.from(newRtcStats.values())){
    if(report.type === 'outbound-rtp'){
      const rtpStreamStats: ProducerStats =  pick(report as ExtendedRTCOutboundStreamStats, ['timestamp','bytesSent','targetBitrate', 'frameWidth', 'frameHeight', 'framesPerSecond', 'qualityLimitationDurations', 'qualityLimitationReason', 'encoderImplementation']);
      if(prevProducerStats){
        rtpStreamStats.outgoingBitrate = calculateBitRate(prevProducerStats.timestamp, rtpStreamStats.timestamp, prevProducerStats.bytesSent, rtpStreamStats.bytesSent);
      }
      Object.assign(newProducerState, rtpStreamStats);
    } 
    else if(report.type === 'candidate-pair'){
      const candidatePairStats = pick(report as RTCIceCandidatePairStats, ['availableOutgoingBitrate']);
      Object.assign(newProducerState, candidatePairStats);
    }
  }
  return newProducerState;
}
function extractConsumerStats(newRtcStats: RTCStatsReport, prevConsumerStats?: ConsumerStats){
  const newConsumerStat: ConsumerStats = {timestamp: 0};
  for(const report of Array.from(newRtcStats.values())){
    if(report.type === 'inbound-rtp'){
      console.log('extracting from inbound-rtp: ', report);
      const rtpStreamStats: ConsumerStats = pick(report as RTCInboundRtpStreamStats, ['timestamp', 'bytesReceived', 'frameWidth', 'frameHeight', 'framesPerSecond']);
      console.log('filtered report:', rtpStreamStats);
      if(prevConsumerStats) {
        rtpStreamStats.incomingBitrate = calculateBitRate(prevConsumerStats.timestamp, rtpStreamStats.timestamp, prevConsumerStats.bytesReceived, rtpStreamStats.bytesReceived);
      }
      Object.assign(newConsumerStat, rtpStreamStats);
    } 
  }
  return newConsumerStat;
}
export const useSoupStore = defineStore('soup', () =>{
  const deviceLoaded = ref(false);
  const sendTransport = shallowRef<soupTypes.Transport>();
  const receiveTransport = shallowRef<soupTypes.Transport>();
  const userHasInteracted = ref(navigator.userActivation.hasBeenActive);
  const videoProducer: ProducerData = reactive({
    producer: undefined,
    stats: undefined,
    _prevStats: undefined,
  });
  const audioProducer: ProducerData = reactive({
    producer: undefined,
    stats: undefined,
    _prevStats: undefined,
  });

  useIntervalFn(async () => {
    if(videoProducer.producer){
      const s = await videoProducer.producer.getStats();
      videoProducer._prevStats = videoProducer.stats;
      videoProducer.stats = extractProducersStats(s, videoProducer._prevStats);
      //  = Object.fromEntries(s.entries());
    }
    if(audioProducer.producer){
      const s = await audioProducer.producer.getStats();
      audioProducer._prevStats = audioProducer.stats;
      audioProducer.stats = extractProducersStats(s, audioProducer._prevStats);
    }
    consumers.forEach(async (c, k) => {
      let cStats = consumerStats.get(k);
      if(cStats){
        cStats._prevStats = cStats.stats;
      }else{
        cStats = {stats: undefined, _prevStats: undefined};
      } 
      const s = await c.getStats();
      cStats.stats = extractConsumerStats(s, cStats._prevStats);

      consumerStats.set(k, cStats);
    });

  }, 5000);
  
  useIntervalFn(() => {
    // @ts-ignore
    userHasInteracted.value = navigator.userActivation.hasBeenActive;
  }, 4000);
  
  // @ts-ignore seems userActivation isnt added to lib.dom.d.ts
  useEventListener(document, 'click', () => userHasInteracted.value = navigator.userActivation.hasBeenActive);

  // Perhaps unintuitive to have producerId as key.
  // But presumably the most common case is to need the consumer belonging to a specific producer.
  const consumers = shallowReactive<Map<ProducerId, soupTypes.Consumer>>(new Map());
  const consumerStats = shallowReactive<Map<ProducerId, {stats: ConsumerStats | undefined, _prevStats: ConsumerStats | undefined}>>(new Map());

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

  async function produce({track, producerInfo, producerId, codecOptions}: {track: MediaStreamTrack, producerId?: ProducerId, producerInfo: ProducerInfo, codecOptions?: soupTypes.ProducerCodecOptions}){
    if(!sendTransport.value){
      throw Error('no transport. Cant produce');
    }
    if(track.kind === 'video' && videoProducer.producer){
      await closeVideoProducer();
    } else if(track.kind === 'audio' && audioProducer.producer) {
      await closeAudioProducer();
    }
    const appData: ProduceAppData = {
      producerInfo,
      producerId,
    };
    const producer = await sendTransport.value.produce({
      codecOptions,
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
    videoProducer._prevStats = undefined;
    await connectionStore.client.soup.closeVideoProducer.mutate();
  }

  async function closeAudioProducer(){
    if(!audioProducer.producer){
      console.warn('tried to close audioProducer, but no audioProducer existed');
      return;
    }
    audioProducer.producer.close();
    audioProducer.producer = undefined;
    audioProducer.stats = undefined;
    audioProducer._prevStats = undefined;
    await connectionStore.client.soup.closeAudioProducer.mutate();
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
    const foundConsumer = consumers.get(producerId);
    if(foundConsumer){
      console.log('re-using already existing consumer');
      return { track: foundConsumer.track, consumerId: foundConsumer.id as ConsumerId};
    }
    const consumerOptions = await connectionStore.client.soup.createConsumer.mutate({producerId});

    return await _handleReceivedConsumerOptions(consumerOptions);
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
  
  // TODO: Negotiate with backend!!
  async function closeConsumer (producerId: ProducerId) {
    await connectionStore.client.soup.closeConsumer.mutate({producerId});
    // consumers.get(producerId)?.close();
    // consumers.delete(producerId);
  }
  
  function closeAllConsumers(){
    consumers.forEach(c => {
      closeConsumer(c.producerId as ProducerId);
    });
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
    closeConsumer,
    closeAllConsumers,
  };
});
