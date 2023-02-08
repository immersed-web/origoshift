<template>
  <a-entity
    :remote-avatar="'id: ' + props.idAvatar"
  >
    {{ props.idAvatar }}
    <a-box
      position="-2 2 -2"
      :scale="scale.join(' ')"
    />
  </a-entity>
</template>

<script setup lang="ts">

import 'aframe';
import { ref } from 'vue';

// Props
const props = defineProps({
  idAvatar: {type: String, default: ''},
});

// Remote avatar
const scale = ref([Math.random(), Math.random(), Math.random()]);

</script>

<style scoped>

</style>
