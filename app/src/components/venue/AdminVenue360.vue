<template>
  <div>
    <div class="flex prose">
      <h2 class="flex-1">
        <!-- <span class="material-icons">videocam</span> -->
        360
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
import SenderList from './SenderList.vue';

// Use imports
const venueStore = useVenueStore();

</script>

