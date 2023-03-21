<template>
  <h1>Cameras view</h1>
  <pre>
    {{ venueStore.currentVenue }}
  </pre>
</template>


<script setup lang="ts">
import {useVenueStore} from '@/stores/venueStore';


const venueStore = useVenueStore();

</script>
