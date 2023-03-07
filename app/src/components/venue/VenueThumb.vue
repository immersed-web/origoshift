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
import { useRouter } from 'vue-router';
import { clientOrThrow } from '@/modules/trpcClient';
import type { RouterOutputs } from '@/modules/trpcClient';
import { useAuthStore } from '@/stores/authStore';

// Use imports
const router = useRouter();
const authStore = useAuthStore();

// Props & emits
const props = defineProps({
  venue: {type: Object as PropType<RouterOutputs['venue']['listMyVenues'][number]>, required: true},
});

const loadAndJoinVenue = async (venueId: string) => {
  try{
    await clientOrThrow.value.venue.loadVenue.mutate({venueId: venueId});
  }
  catch(e){
    console.log(e);
  }
  await clientOrThrow.value.venue.joinVenue.mutate({venueId});
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>

<style scoped>

</style>
