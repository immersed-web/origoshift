<template>
  <a-entity
    remote-avatar
    ref="avatar"
  >
    <a-box
      position="-2 2 -2"
      scale="0.5 2 0.5"
    />
  </a-entity>
</template>

<script setup lang="ts">

import 'aframe';
import type { Entity } from 'aframe';
import { onMounted, ref } from 'vue';

// Remote avatar

const avatar = ref<Entity>();

onMounted(() => {
  setInterval(randomizePosition, 1000);
});

function randomizePosition() {
  const position = [(Math.random() * 4 + 2), 0, (Math.random() * 4 + 2)];
  avatar.value?.emit('moveTo', {position});
}

</script>

<style scoped>

</style>
