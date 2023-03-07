<template>
  <div class="flex space-x-2">
    <div
      v-for="venue in myVenues"
      :key="venue.venueId"
    >
      <VenueThumb
        :venue="venue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

import { onBeforeMount, ref } from 'vue';
import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import VenueThumb from '@/components/venue/VenueThumb.vue';

const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
});

</script>

<style scoped>

</style>
