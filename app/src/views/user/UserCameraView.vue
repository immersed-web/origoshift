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
import { onMounted, ref, watch } from 'vue';
import ConsumerElement from '@/components/ConsumerElement.vue';
import { useVenueStore } from '@/stores/venueStore';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const connectionStore = useConnectionStore();
const soup = useSoupStore();
const venueStore = useVenueStore();

const cProducers = ref();
watch(cProducers, (newProducers) => {
  console.log('cameraProducers were updated', newProducers);
  const consumers = soup.consumeCurrentCamera();
});

onMounted(async () => {
  if(!venueStore.currentVenue){
    await venueStore.joinVenue(props.venueId);
  }
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();
  const joinResponse = await connectionStore.client.camera.joinCamera.mutate({ cameraId: props.cameraId });
  cProducers.value = venueStore.currentVenue?.cameras[props.cameraId].producers;
  // const consumers = soup.consumeCurrentCamera();
});


</script>
