<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="venue in clientStore.clientState?.ownedVenues"
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

// import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
// import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import VenueThumb from '@/components/venue/VenueThumb.vue';
import { useAuthStore } from '@/stores/authStore';
import { useClientStore } from '@/stores/clientStore';

// Use imports
const router = useRouter();
const authStore = useAuthStore();
const clientStore = useClientStore();

// const myVenues = ref<RouterOutputs['admin']['listMyVenues']>();
// onBeforeMount(async () => {
//   myVenues.value = await clientOrThrow.value.admin.listMyVenues.query();
// });

const joined = async () => {
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>

<style scoped>

</style>
