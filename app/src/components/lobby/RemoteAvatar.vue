<template>
  <a-entity
    ref="remoteAvatar"
    remote-avatar="interpolationTime: 350"
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
import type { ClientTransform } from 'schemas';
import { ref, watch, onMounted } from 'vue';

// Props & emits
const props = defineProps<{
  transform: ClientTransform,
  cameraPosition: Array<Number>,
}>();

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
  remoteAvatar.value.object3D.position.set(...props.transform.position);
  remoteAvatar.value.object3D.quaternion.set(...props.transform.orientation);
});

const remoteAvatar = ref<Entity>();
watch(() => props.transform, () => {
  // console.log('remote avatar transform updated!');
  if(!remoteAvatar.value) {
    console.error('could update avatar transform cause entityRef was undefined');
    return;
  }
  remoteAvatar.value.emit('moveTo', {position: props.transform.position});
  remoteAvatar.value.emit('rotateTo', {orientation: props.transform.orientation});
});

// watch(() => props.cameraPosition, () => {
//   if(!remoteAvatar.value) { return; }
//   remoteAvatar.value.emit('cameraPosition', {position: props.cameraPosition});
// });

</script>

<style scoped>

</style>
