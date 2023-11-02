<template>
  <div v-if="!soup.userHasInteracted">
    <button
      @click="soup.userHasInteracted = true"
      class="btn btn-primary"
    >
      Starta
    </button>
  </div>
    
  <CameraView
    v-else
    :camera-id="props.cameraId"
    :venue-id="props.venueId"
  />
</template>

<script setup lang="ts">
import CameraView from '@/components/CameraView.vue';
// import { useRouter } from 'vue-router';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, watch } from 'vue';
import { useCameraStore } from '@/stores/cameraStore';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

// const router = useRouter();

const soup = useSoupStore();
const camera = useCameraStore();

onMounted(async () => {
  // if(soup.userHasInteracted){
  //   await loadStuff();
  //   // persistedCameraStore.trigger();
  // }
});

// watch(router.currentRoute, () => {
//   // loadStuff();
// });

onBeforeUnmount(() => {
  console.log('Leaving camera');
  camera.leaveCurrentCamera();
});


</script>
