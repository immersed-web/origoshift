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
import { useAuthStore } from '@/stores/authStore';

// Use imports
const router = useRouter();
const authStore = useAuthStore();

const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
});

const joined = async () => {
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>

<style scoped>

</style>
