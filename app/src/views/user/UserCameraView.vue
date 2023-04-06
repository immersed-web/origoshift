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
import type { CameraId } from 'schemas';
import { onMounted } from 'vue';
import ConsumerElement from '@/components/ConsumerElement.vue';

const props = defineProps<{
  cameraId: CameraId,
}>();

const connectionStore = useConnectionStore();
const soup = useSoupStore();

onMounted(async () => {
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();
  const joinResponse = await connectionStore.client.camera.joinCamera.mutate({ cameraId: props.cameraId });
  const consumers = soup.consumeCurrentCamera();
});


</script>
