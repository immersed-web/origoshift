<template>
  <div class="min-h-screen">
    <div class="absolute bottom-5 left-5 z-10 rounded-md bg-base-100 p-4 flex items-center gap-4">
      <span>Modell: {{ venueStore.modelUrl }}</span>
      <button
        class="btn btn-primary"
      >
        Öppna 360-vy för samtliga deltagare
      </button>
    </div>
    <VrAFrame
      :model-url="venueStore.modelUrl"
      class="min-h-screen"
    />
  </div>
</template>

<script setup lang="ts">
import VrAFrame from '../components/lobby/VrAFrame.vue';
import { useVenueStore } from '@/stores/venueStore';

const venueStore = useVenueStore();

</script>

