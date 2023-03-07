<template>
  <div class="grid grid-flow-row gap-4 m-6">
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
import { clientOrThrow, isTRPCClientError, type RouterOutputs } from '@/modules/trpcClient';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
type Venue = RouterOutputs['venue']['listAllowedVenues'][number];


const router = useRouter();
const venues = ref<Venue[]>();

onBeforeMount(async () => {
  venues.value = await clientOrThrow.value.venue.listAllowedVenues.query();
});

function tryToJoinAndEnterCamera(venue: Venue){

  const tryToJoin = async () => {
    try {
      await clientOrThrow.value.venue.loadVenue.mutate({venueId: venue.venueId});
      await clientOrThrow.value.venue.joinVenueAsSender.mutate({venueId: venue.venueId});
      router.push({name: 'cameraHome'});
    } catch(e) {
      if(isTRPCClientError(e)){
        console.error(e.message);
      } else if (e instanceof Error){
        console.error(e.message);
      }
      setTimeout(() => {
        tryToJoin();
      }, 5000);
    }
  };
  tryToJoin();

}

</script>
