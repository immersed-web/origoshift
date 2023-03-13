<template>
  <div class="flex space-x-2">
    <div
      v-for="venue in myVenues"
      :key="venue.venueId"
    >
      <VenueThumb
        :venue="venue"
        @joined="joined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import VenueThumb from '@/components/venue/VenueThumb.vue';

// Router
const router = useRouter();

const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
});

const joined = async () => {
  router.push({name: 'userVenue'});
};

</script>

<style scoped>

</style>
