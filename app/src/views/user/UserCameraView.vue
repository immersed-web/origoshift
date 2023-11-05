<template>
  <div v-if="!soup.userHasInteracted">
    <button
      @click="soup.userHasInteracted = true"
      class="btn btn-primary"
    >
      Starta
    </button>
  </div>
    
  <div
    v-else
    class="w-full h-screen"
  >
    <CameraView
      :camera-id="props.cameraId"
      :venue-id="props.venueId"
    />
  </div>
</template>

<script setup lang="ts">
import CameraView from '@/components/CameraView.vue';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { onBeforeUnmount, onMounted } from 'vue';
import { useCameraStore } from '@/stores/cameraStore';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const soup = useSoupStore();
const camera = useCameraStore();

onMounted(async () => {
  // if(soup.userHasInteracted){
  //   await loadStuff();
  //   // persistedCameraStore.trigger();
  // }
});

onBeforeUnmount(() => {
  console.log('Leaving camera');
  camera.leaveCurrentCamera();
});

</script>
