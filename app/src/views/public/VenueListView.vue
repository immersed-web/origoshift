<template>
  <h1>Public Venue List</h1>
  <VenueList :venues="receivedVeues" />
  <pre>
    {{ receivedVeues }}
  </pre>
</template>

<script setup lang="ts">

import type { RouterOutputs } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';
import { onBeforeMount, ref } from 'vue';
import VenueList from '@/components/venue/VenueList.vue';

const receivedVeues = ref<RouterOutputs['venue']['listAllowedVenues']>([]);


const connection = useConnectionStore();
onBeforeMount(async () =>{
  receivedVeues.value = await connection.client.venue.listAllowedVenues.query();
});

</script>
