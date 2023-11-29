<template>
  <a-entity
    ref="remoteAvatar"
    remote-avatar="interpolationTime: 350"
    mediastream-audio-source
  >
    <a-entity
      gltf-model="#avatar-asset"
      position="0 -1.5 0"
      rotation="0 180 0"
    />
  </a-entity>
</template>

<script setup lang="ts">

import 'aframe';
import type { Entity } from 'aframe';
import type { ClientTransform, ConnectionId } from 'schemas';
import { ref, watch, onMounted } from 'vue';
import type { useVrSpaceStore } from '@/stores/vrSpaceStore';
import type { ProducerId } from 'schemas/mediasoup';
import { useSoupStore } from '@/stores/soupStore';

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

const remoteAvatar = ref<Entity>();
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

watch(() => props.clientInfo.producers.audioProducer?.producerId, async (newAudioProducerId) => {
  if(!newAudioProducerId){
    console.log('newProducerId was undefined');
    return;
  }
  console.log('setting stream for avatar!');

  const stream = await getStreamFromProducerId(newAudioProducerId);
  remoteAvatar.value?.emit('mediaStream', stream);

});

async function getStreamFromProducerId(producerId?: ProducerId){
  if(!producerId) return undefined;
  let consumer = soupStore.consumers.get(producerId);
  if(!consumer){
    const {track } = await soupStore.consume(producerId);
    return new MediaStream([track]);
  }
  return new MediaStream([consumer.track]);
}

// watch(() => props.cameraPosition, () => {
//   if(!remoteAvatar.value) { return; }
//   remoteAvatar.value.emit('cameraPosition', {position: props.cameraPosition});
// });

</script>

<style scoped>

</style>
