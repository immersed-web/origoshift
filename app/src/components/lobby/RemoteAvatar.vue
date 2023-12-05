<template>
  <a-entity
    ref="remoteAvatar"
    remote-avatar="interpolationTime: 350"
    mediastream-audio-source
    @loaded="onAvatarEntityLoaded"
  >
    <a-text
      class="distance-debug"
      value="unset"
      position="1 1 0"
      side="double"
    />
    <a-circle
      side="double"
      class="audio-level"
      position="0 3 0"
      color="yellow"
    />
    <a-entity
      gltf-model="#avatar-asset"
      position="0 -1.5 0"
      rotation="0 180 0"
    />
    <audio
      ref="dummyAudioTag"
      muted
      autoplay
      playsinline
    />
  </a-entity>
</template>

<script setup lang="ts">

import 'aframe';
import type { Entity } from 'aframe';
import type { ClientTransform, ConnectionId } from 'schemas';
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import type { useVrSpaceStore } from '@/stores/vrSpaceStore';
import type { ProducerId } from 'schemas/mediasoup';
import { useSoupStore } from '@/stores/soupStore';
import { useIntervalFn } from '@vueuse/core';

// Props & emits
const props = defineProps<{
  clientInfo:  NonNullable<ReturnType<typeof useVrSpaceStore>['currentVrSpace']>['clients'][ConnectionId]
}>();
const soupStore = useSoupStore();
// Remote avatar
const scale = ref([Math.random(), Math.random(), Math.random()]);

// Distance to client camera callbacks
const distanceColor = ref('white');
function distanceClose (e: CustomEvent<number>){
  distanceColor.value = 'green';
  // console.log('Came close', e.detail);
}

function distanceFar (e: CustomEvent<number>){
  distanceColor.value = 'white';
  // console.log('Went away', e.detail);
}
onMounted(async () => {
  console.log('remoteAvatar mounted');
  if(!remoteAvatar.value) {
    console.error('remoteAvatar entity ref undefined');
    return;
  }
  // TODO: Risky thing here. We rely on this code executuing before the remote-avatar component initializes.
  // The remote-avatar component will read and set the entitie's interpolationbuffer in the init function. 
  if(props.clientInfo.transform){
    remoteAvatar.value.object3D.position.set(...props.clientInfo.transform.position);
    remoteAvatar.value.object3D.quaternion.set(...props.clientInfo.transform.orientation);
  }
});
onBeforeUnmount(async () => {
  console.log('remoteAvatar will unmount');
  const pId = props.clientInfo.producers.audioProducer?.producerId;
  if(pId && soupStore.consumers.has(pId)){
    console.log('gonna closeConsumer with producerId:', pId);
    await soupStore.closeConsumer(pId);
  }
});

const remoteAvatar = ref<Entity>();
const dummyAudioTag = ref<HTMLAudioElement>();
watch(() => props.clientInfo, (n, o) => console.log('remoteAvatar prop updated. new:', n, ' old:', o));
watch(() => props.clientInfo.transform, (newTransform) => {
  // console.log('remote avatar transform updated!');
  if(!remoteAvatar.value) {
    console.error('could update avatar transform cause entityRef was undefined');
    return;
  }
  if(!newTransform) {
    console.warn('clientInfo transform was undefined');
    return;
  }
  console.log('emitting received transform to avatar entity');
  remoteAvatar.value.emit('moveTo', {position: newTransform.position});
  remoteAvatar.value.emit('rotateTo', {orientation: newTransform.orientation});
});

let stream = shallowRef<MediaStream>();
watch(stream, () => {
  if(!stream.value) {
    console.error('stream became undefined');
    return;
  }
  if(!dummyAudioTag.value){
    console.error('audio dummytag was undefined');
    return;
  }
  dummyAudioTag.value.srcObject = stream.value;
  if(!remoteAvatar.value?.hasLoaded){
    console.warn('skipping to emit stream because aframe entity (and thus the components) was not yet ready or undefined');
    return;
  }
  console.log('emitting stream for avatar after stream was updated:', stream.value);
  remoteAvatar.value.emit('setMediaStream', {stream: stream.value});
});

watch(() => props.clientInfo.producers.audioProducer?.producerId, async (newAudioProducerId, oldAudioProducerId) => {
  console.log('audioProducer was updated. new:', newAudioProducerId, ' old:', oldAudioProducerId);
  if(!newAudioProducerId){
    console.log('newProducer was undefined');
    return;
  }
  stream.value = await getStreamFromProducerId(newAudioProducerId);
}, {immediate: true});

async function onAvatarEntityLoaded(e: DetailEvent<any>){
  console.log('avatar a-entity loaded!');
  // NOTE: For some reason the event isnt received by the entity if we dont put it on the event queue.
  // I guess there is something that makes the entity trigger the loaded event before it is actually fully ready.
  await new Promise(res => setTimeout(res, 0));
  if(!stream.value){
    console.log('stream is undefined. Will not emit');
    return;
  }
  if(!remoteAvatar.value){
    console.error('remoteAvatar was undefined');
    return;
  }
  console.log('emitting mediastream to entity after avatar entity loaded', stream.value);
  remoteAvatar.value.emit('setMediaStream', {stream: stream.value});
}

async function getStreamFromProducerId(producerId?: ProducerId){
  if(!producerId) return undefined;
  let consumerData = soupStore.consumers.get(producerId);
  if(!consumerData){
    await soupStore.consume(producerId);
    consumerData = soupStore.consumers.get(producerId)!;
    // return new MediaStream([track]);
  }
  // rtpReceiver = consumerData.consumer.rtpReceiver;
  return new MediaStream([consumerData.consumer.track]);
}

</script>

<style scoped>

</style>
