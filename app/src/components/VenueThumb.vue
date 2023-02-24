<template>
  <div>
    <button
      class="btn btn-primary"
      @click="loadAndJoinVenue(props.venue.venueId)"
    >
      {{ props.venue?.name }}
    </button>
  </div>
</template>

<script setup lang="ts">

import { defineProps, type PropType } from 'vue';
import { useRouter } from 'vue-router';
import { client } from '@/modules/trpcClient';
import type { RouterOutputs } from '@/modules/trpcClient';

// Router
const router = useRouter();

// Props & emits
const props = defineProps({
  venue: {type: Object as PropType<RouterOutputs['venue']['listMyVenues'][number]>, required: true},
});

const loadAndJoinVenue = async (venueId: string) => {
  try{
    await client.value.venue.loadVenue.mutate({venueId: venueId});
  }
  catch(e){
    console.log(e);
  }
  await client.value.venue.joinVenue.mutate({venueId});
  router.push({name: 'userVenue'});
};

</script>

<style scoped>

</style>
