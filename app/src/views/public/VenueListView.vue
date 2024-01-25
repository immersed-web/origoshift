<template>
  <div class="flex flex-col gap-4">
    <h1>Pågående event</h1>
    <VenueList
      v-if="venuesOngoing.length"
      :venues="venuesOngoing"
      @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
    />
    <div v-else>
      <p>
        Inga pågående event
      </p>
    </div>

    <h1>Kommande event</h1>
    <VenueList
      v-if="venuesUpcoming.length"
      :venues="venuesUpcoming"
      @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
    />
    <div v-else>
      <p>
        Inga kommande event
      </p>
    </div>

    <h1>Tidigare event</h1>
    <VenueList
      v-if="venuesPast.length"
      :venues="venuesPast"
      @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
    />
    <div v-else>
      <p>
        Inga tidigare event
      </p>
    </div>


    <h1>Event utan datum</h1>
    <VenueList
      v-if="venuesUnscheduled.length"
      :venues="venuesUnscheduled"
      @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
    />
    <div v-else>
      <p>
        Inga event utan datum
      </p>
    </div>
  </div>

  <!-- <pre>
    ALLOWED:
    {{ receivedVenues }}
  </pre> -->

  <!-- <pre>
    LOADED:
    {{ venuesLoaded }}
  </pre>

  <pre>
    ONGOING:
    {{ venuesOngoing }}
  </pre>

  <pre>
    NOT ONGOING:
    {{ venuesNotOngoing }}
  </pre> -->
</template>

<script setup lang="ts">

import type { RouterOutputs } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';
import { computed, onBeforeMount, ref } from 'vue';
import VenueList from '@/components/venue/VenueList.vue';
import type { VenueId } from 'schemas';
import { useRouter } from 'vue-router';
import { isPast } from 'date-fns';

const router = useRouter();
const venuesAllowed = ref<RouterOutputs['venue']['listAllowedVenues']>([]);
const venuesLoaded = ref<RouterOutputs['venue']['listLoadedVenuesPublicState']>();

const connection = useConnectionStore();
onBeforeMount(async () =>{
  venuesAllowed.value = await connection.client.venue.listAllowedVenues.query();
  venuesLoaded.value = await connection.client.venue.listLoadedVenuesPublicState.query();
});

const venuesOngoing = computed(() => {
  return venuesAllowed.value.filter(v => venuesLoaded.value && v.venueId in venuesLoaded.value);
  // return venuesAllowed.value.filter(v => {
  //   if(!venuesLoaded.value || !(v.venueId in venuesLoaded.value)) { return false;}
  //   const vLoaded = venuesLoaded.value[v.venueId as VenueId];
  //   return vLoaded.state.doorsAreOpen || vLoaded.state.streamIsActive;
  // });
});

const venuesNotOngoing = computed(() => {
  return venuesAllowed.value.filter(v => !venuesOngoing.value.includes(v));
});

const venuesUpcoming = computed(() => {
  return venuesNotOngoing.value.filter(v => v.streamStartTime && !isPast(v.streamStartTime));
});

const venuesPast = computed(() => {
  return venuesNotOngoing.value.filter(v => v.streamStartTime && isPast(v.streamStartTime));
});

const venuesUnscheduled = computed(() => {
  return venuesNotOngoing.value.filter(v => !v.streamStartTime);
});

async function goToVenue(venueId: VenueId){
  // await venueStore.joinVenue(venueId);
  router.push({name: 'userVenue', params: { venueId }});
}

</script>
