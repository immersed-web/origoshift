<template>
  <h1>Watching camera: {{ props.cameraId }}</h1>
  <ConsumerElement
    v-for="[producerId, consumer] in soup.consumers"
    :key="producerId"
    :kind="consumer.kind"
    :track="consumer.track"
  />
</template>

<script setup lang="ts">
import { useConnectionStore } from '@/stores/connectionStore';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { onBeforeMount, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import ConsumerElement from '@/components/ConsumerElement.vue';
import { useVenueStore } from '@/stores/venueStore';
import { useCameraStore } from '@/stores/cameraStore';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();

watch(() => camera.producers, (updatedProducers) => {
  console.log('cameraProducers were updated:', toRaw(updatedProducers));
  camera.consumeCurrentCamera();
});

onBeforeMount(async () => {
  if(!venueStore.currentVenue){
    await venueStore.joinVenue(props.venueId);
  }
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();

  await camera.joinCamera(props.cameraId);
});

onBeforeUnmount(() => {
  camera.leaveCurrentCamera();
});


</script>
