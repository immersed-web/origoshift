<template>
  <a-entity
    remote-avatar
    @close="distanceClose"
    @far="distanceFar"
  >
    <a-box
      position="-2 2 -2"
      :scale="scale.join(' ')"
      :color="distanceColor"
    />
  </a-entity>
</template>

<script setup lang="ts">

import 'aframe';
import { ref } from 'vue';

// Remote avatar
const scale = ref([Math.random(), Math.random(), Math.random()]);

// Distance to client camera callbacks
const distanceColor = ref('white');
function distanceClose (e: CustomEvent<number>){
  distanceColor.value = 'green';
  console.log('Came close', e.detail);
}

function distanceFar (e: CustomEvent<number>){
  distanceColor.value = 'white';
  console.log('Went away', e.detail);
}

</script>

<style scoped>

</style>
