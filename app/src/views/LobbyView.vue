<template>
  <div class="min-h-screen">
    <div class="absolute bottom-5 left-5 z-10 rounded-md bg-base-100 p-4 flex items-center gap-4">
      <span>Modell: {{ url }}</span>
      <button
        class="btn btn-primary"
      >
        Öppna 360-vy för samtliga deltagare
      </button>
    </div>
    <VrAFrame
      :model-url="url"
      class="min-h-screen"
    />
  </div>
</template>

<script setup lang="ts">
import VrAFrame from '../components/lobby/VrAFrame.vue';
import { useVenueStore } from '@/stores/venueStore';
import { computed } from 'vue';

const venueStore = useVenueStore();

const url = computed(() => {
  if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelUrl.indexOf('https://') === 0){
    return venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelUrl;
  }
  else {
    let path = `${import.meta.env.EXPOSED_FILESERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PORT}`;
    path += '/uploads/3d_models/';
    path += venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelUrl;
    return path;
  }
});

</script>

