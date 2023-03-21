<template>
  <div>
    <div class="flex mb-4">
      <h2 class="flex-1">
        <!-- <span class="material-icons">videocam</span> -->
        <RouterLink :to="{name: 'adminCameras'}">
          360
        </RouterLink>
      </h2>
      <button
        class="btn btn-primary"
      >
        Gå in i 360
      </button>
    </div>
    <div>
      <SenderList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVenueStore } from '@/stores/venueStore';
import SenderList from '@/components/venue/SenderList.vue';

// Use imports
const venueStore = useVenueStore();

</script>

