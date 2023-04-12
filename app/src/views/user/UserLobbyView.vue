<template>
  <div>
    <div class="min-h-screen z-0">
      <VrAFrame
        :model-url="venueStore.modelUrl"
        :navmesh-url="venueStore.navmeshUrl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VrAFrame from '../../components/lobby/VrAFrame.vue';
import { useVenueStore } from '@/stores/venueStore';

const venueStore = useVenueStore();

</script>

