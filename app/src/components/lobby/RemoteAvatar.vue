<template>
  <a-entity
    remote-avatar="interpolationTime: 500"
    @close="distanceClose"
    @far="distanceFar"
    ref="remoteAvatar"
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
import { ref, type PropType, watch  } from 'vue';

// Props & emits
const props = defineProps({
  transform: {type: Object as PropType<ClientTransform>, required: true},
  cameraPosition: {type: Array<Number>, required: true},
});

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

const remoteAvatar = ref<Entity>();
watch(() => props.transform, () => {
  if(!remoteAvatar.value) { return; }
  remoteAvatar.value.emit('moveTo', {position: props.transform.position});
  remoteAvatar.value.emit('rotateTo', {orientation: props.transform.orientation});
});

watch(() => props.cameraPosition, () => {
  if(!remoteAvatar.value) { return; }
  remoteAvatar.value.emit('cameraPosition', {position: props.cameraPosition});
});

</script>

<style scoped>

</style>
