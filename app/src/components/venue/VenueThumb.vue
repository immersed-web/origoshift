<template>
  <div>
    <button
      class="btn btn-primary"
      @click="loadAndJoinVenue(props.venue.venueId)"
    >
      {{ props.venue.name }}
    </button>
  </div>
</template>

<script setup lang="ts">

import type { PropType } from 'vue';
// import { useRouter } from 'vue-router';
import { clientOrThrow } from '@/modules/trpcClient';
import type { RouterOutputs } from '@/modules/trpcClient';
import { useVenueStore } from '@/stores/venueStore';
import type { VenueId } from 'schemas/*';

// Use imports
// const router = useRouter();
const venueStore = useVenueStore();

// Props & emits
const props = defineProps({
  venue: {type: Object as PropType<RouterOutputs['admin']['listMyVenues'][number]>, required: true},
});
const emit = defineEmits<{
  (e: 'joined'): void,
}>();

const loadAndJoinVenue = async (venueId: VenueId) => {
  try{
    const loadedVenueState = await venueStore.loadVenue(venueId);
    console.log('Loaded venue state', loadedVenueState);
    await venueStore.joinVenue(venueId);
    emit('joined');
  }
  catch(e){
    console.log(e);
  }
};

</script>

<style scoped>

</style>
