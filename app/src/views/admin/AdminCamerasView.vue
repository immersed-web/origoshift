<template>
  <h1>Cameras view</h1>
  <SenderList />
  <pre>
    {{ venueStore.currentVenue }}
  </pre>
</template>


<script setup lang="ts">
import SenderList from '@/components/venue/SenderList.vue';
import {useVenueStore} from '@/stores/venueStore';


const venueStore = useVenueStore();

</script>
