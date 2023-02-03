<template>
  <a-entity
    remote-avatar
    ref="avatar"
  >
    <!-- <a-box
      position="-2 2 -2"
      scale="0.5 2 0.5"
      :animation="'property: object3D.position.x; to: ' + position[0] + ';'"
      :animation__2="'property: object3D.position.y; to: ' + position[1] + ';'"
      :animation__3="'property: object3D.position.z; to: ' + position[2] + ';'"
    /> -->
    <a-box
      position="-2 2 -2"
      scale="0.5 2 0.5"
    />
  </a-entity>
</template>

<script setup lang="ts">
// defineProps<{
//   msg: string
// }>();

import 'aframe';
import type { Entity } from 'aframe';
import { onMounted, ref } from 'vue';

// Remote avatar

const avatar = ref<Entity>();

onMounted(() => {
  setInterval(randomizePosition, 1000);
});

const position = ref([-2, 2, -2]);
function randomizePosition() {
  position.value[0] = (Math.random() * 4 + 2);
  position.value[1] = 0;
  position.value[2] = (Math.random() * 4 + 2);
  // position.value = (Math.random()*4+2).toString() + ' 2 ' + (Math.random()*4+2).toString()
  avatar.value?.emit('moveTo', {position});
}

</script>

<style scoped>

</style>
