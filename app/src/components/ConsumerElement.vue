<template>
  <Component
    autoplay
    :is="$props.kind"
    ref="mediaTag"
  />
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type {types as soupTypes } from 'mediasoup-client';

const props = defineProps<{
  track: MediaStreamTrack,
  kind: soupTypes.Consumer['kind'],
}>();

const mediaTag = ref<HTMLMediaElement>();
onMounted(() => {
  if(!mediaTag.value){
    console.error('ref undefined!');
    return;
  }
  if(props.track){
    mediaTag.value.srcObject = new MediaStream([props.track]);
  }
});
</script>
