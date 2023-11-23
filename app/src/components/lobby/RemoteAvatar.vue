<template>
  <a-entity
    ref="remoteAvatar"
    :position="`${props.transform.position[0]} ${props.transform.position[1]} ${props.transform.position[2]} `"
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
import { type Entity, THREE } from 'aframe';
import type { ClientTransform } from 'schemas';
import { ref, type PropType, watch, onMounted  } from 'vue';

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
onMounted(() => {
  if(!remoteAvatar.value) {
    console.error('remoteAvatar entity ref undefined');
    return;
  }
  // remoteAvatar.value.object3D.setRotationFromQuaternion(new THREE.Quaternion(...props.transform.position));
  // remoteAvatar.value.object3D.position.set(...props.transform.position);
});

const remoteAvatar = ref<Entity>();
watch(() => props.transform, () => {
  if(!remoteAvatar.value) {
    console.error('could update avatar transform cause entityRef was undefined');
    return;
  }
  // remoteAvatar.value.emit('moveTo', {position: props.transform.position});
  // remoteAvatar.value.emit('rotateTo', {orientation: props.transform.orientation});
  // remoteAvatar.value.object3D.setRotationFromQuaternion(new THREE.Quaternion(...props.transform.position));
  // remoteAvatar.value.object3D.position.set(...props.transform.position);
});

// watch(() => props.cameraPosition, () => {
//   if(!remoteAvatar.value) { return; }
//   remoteAvatar.value.emit('cameraPosition', {position: props.cameraPosition});
// });

</script>

<style scoped>

</style>
