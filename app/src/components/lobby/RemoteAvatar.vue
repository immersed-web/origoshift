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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { useVrSpaceStore } from '@/stores/vrSpaceStore';
import type { ProducerId } from 'schemas/mediasoup';
import { useSoupStore } from '@/stores/soupStore';
import { useIntervalFn } from '@vueuse/core';

// Props & emits
const props = defineProps<{
  clientInfo:  NonNullable<ReturnType<typeof useVrSpaceStore>['currentVrSpace']>['clients'][ConnectionId]
  // transform: ClientTransform,
  // audioStream?: MediaStream,
  cameraPosition: Array<Number>,
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
  const pId = props.clientInfo.producers.audioProducer?.producerId;
  if(pId){
    await soupStore.closeConsumer(pId);
  }
});

const remoteAvatar = ref<Entity>();
const dummyAudioTag = ref<HTMLAudioElement>();
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
  remoteAvatar.value.emit('moveTo', {position: newTransform.position});
  remoteAvatar.value.emit('rotateTo', {orientation: newTransform.orientation});
});

let stream: MediaStream | undefined;
// let rtpReceiver: RTCRtpReceiver | undefined;

watch(() => props.clientInfo.producers.audioProducer, async (newAudioProducer) => {
  console.log('audioProducer was updated!');
  if(!newAudioProducer){
    console.log('newProducer was undefined');
    return;
  }
  stream = await getStreamFromProducerId(newAudioProducer.producerId);
  if(dummyAudioTag.value && stream){
    console.log('attaching stream to dummy audio tag');
    dummyAudioTag.value.srcObject = stream;
  }
  if(!remoteAvatar.value?.hasLoaded){
    console.warn('skipping to set stream because aframe entity was not yet ready or undefined');
    return;
  }
  console.log('emitting stream for avatar after audioproducer was updated!');
  remoteAvatar.value.emit('setMediaStream', {stream});
});

function onAvatarEntityLoaded(e: DetailEvent<any>){
  console.log('avatar a-entity loaded!');
  if(!remoteAvatar.value){
    console.error('remoteAvatar was undefined');
    return;
  }
  if(stream){
    console.log('emitting mediastream to entity after avatar entity loaded');
    remoteAvatar.value.emit('mediaStream', {stream});
  }
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

// watch(() => props.cameraPosition, () => {
//   if(!remoteAvatar.value) { return; }
//   remoteAvatar.value.emit('cameraPosition', {position: props.cameraPosition});
// });

</script>

<style scoped>

</style>
