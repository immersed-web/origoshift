<template>
  <div>
    <div class="min-h-screen z-0">
      <VrAFrame
        v-if="venueStore.modelUrl && vrSpaceStore.currentVrSpace"
        :model-url="venueStore.modelUrl"
        :navmesh-url="venueStore.navmeshUrl"
        :model-scale="venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.scale"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import VrAFrame from '../../components/lobby/VrAFrame.vue';
import { useVrSpaceStore } from '@/stores/vrSpaceStore';
import { useVenueStore } from '@/stores/venueStore';

const venueStore = useVenueStore();
const vrSpaceStore = useVrSpaceStore();
onMounted(async () => {
  await vrSpaceStore.enterVrSpace();
});

</script>

