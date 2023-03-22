<template>
  <h1>Cameras view</h1>
  <SenderList />
  <pre>
    {{ venueStore.currentVenue }}
  </pre>
  <pre>
    {{ adminStore.connectedSenders }}
  </pre>
</template>


<script setup lang="ts">
import SenderList from '@/components/venue/SenderList.vue';
import {useVenueStore} from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';


const venueStore = useVenueStore();
const adminStore = useAdminStore();

</script>
