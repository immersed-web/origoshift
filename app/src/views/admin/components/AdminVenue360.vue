<template>
  <div>
    <div class="flex mb-4">
      <h2 class="flex-1">
        <!-- <span class="material-icons">videocam</span> -->
        Kameror
      </h2>
      <RouterLink :to="{name: 'adminCameras'}">
        <button
          class="btn btn-primary btn-sm"
        >
          <span class="material-icons">settings</span>
          Redigera
        </button>
      </RouterLink>
    </div>
    <div>
      <CamerasList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVenueStore } from '@/stores/venueStore';
import CamerasList from '@/components/venue/CamerasList.vue';

// Use imports
const venueStore = useVenueStore();

</script>

