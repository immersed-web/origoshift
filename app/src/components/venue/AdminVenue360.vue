<template>
  <div>
    <h2 class="card-title">
      <!-- <span class="material-icons">videocam</span> -->
      360
    </h2>
    <button
      class="btn btn-primary"
    >
      Gå in i 360
    </button>
  </div>
</template>

<script setup lang="ts">
import { useVenueStore } from '@/stores/venueStore';

// Use imports
const venueStore = useVenueStore();

</script>

