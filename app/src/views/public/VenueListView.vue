<template>
  <h1>Public Venue List</h1>
  <VenueList
    :venues="receivedVeues"
    @venue-picked="(venue) => goToVenue(venue.venueId)"
  />
  <pre>
    {{ receivedVeues }}
  </pre>
</template>

<script setup lang="ts">

import type { RouterOutputs } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';
import { onBeforeMount, ref } from 'vue';
import VenueList from '@/components/venue/VenueList.vue';
import type { VenueId } from 'schemas';
import { useRouter } from 'vue-router';

const router = useRouter();
const receivedVeues = ref<RouterOutputs['venue']['listAllowedVenues']>([]);


const connection = useConnectionStore();
onBeforeMount(async () =>{
  receivedVeues.value = await connection.client.venue.listAllowedVenues.query();
});

async function goToVenue(venueId: VenueId){
  // await venueStore.joinVenue(venueId);
  router.push({name: 'userVenue', params: { venueId }});
}

</script>
