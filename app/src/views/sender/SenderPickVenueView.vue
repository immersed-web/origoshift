<template>
  <div class="grid max-w-xl grid-flow-row gap-4 m-6">
    <button
      class="btn btn-primary"
      v-for="venue in venues"
      :key="venue.venueId"
      :venue="venue"
      @click="tryToJoinAndEnterCamera(venue)"
    >
      {{ venue.name }}
    </button>
  </div>
</template>
<script lang="ts" setup>
import type { RouterOutputs } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';
// import { useSenderStore } from '@/stores/senderStore';
import { useVenueStore } from '@/stores/venueStore';

import type { VenueId } from 'schemas';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
type Venue = RouterOutputs['venue']['listAllowedVenues'][number];


const router = useRouter();
const venues = ref<Venue[]>();
// const senderStore = useSenderStore();
const venueStore = useVenueStore();
const connection = useConnectionStore();

onBeforeMount(async () => {
  venues.value = await connection.client.venue.listAllowedVenues.query();
});

function tryToJoinAndEnterCamera(venue: Venue){
  venueStore.savedVenueId = venue.venueId as VenueId;
  router.push({name: 'senderHome'});
}

</script>
