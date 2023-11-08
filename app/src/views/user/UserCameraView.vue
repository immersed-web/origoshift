<template>
  <div
    class="w-full h-screen"
  >
    <div
      class="w-full h-full flex justify-center items-center"
      v-if="!soup.userHasInteracted"
    >
      <button
        class="btn btn-primary btn-lg"
      >
        Starta
      </button>
    </div>
    <CameraView
      v-else
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
