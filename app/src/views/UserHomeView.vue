<template>
  <LoggedInLayout>
    <h1 class="text-5xl font-bold">
      Välkommen {{ clientStore.clientState.userName }}
    </h1>
    <div>
      <h2 class="text-3xl font-bold">
        Dina venues
      </h2>
      <div class="flex space-x-2">
        <div
          v-for="venue in myVenues"
          :key="venue.venueId"
        >
          <VenueThumb
            :venue="venue"
          />
        </div>
        <div>
          <button
            class="btn btn-outline btn-primary"
            @click="createVenue"
          >
            Skapa en ny venue
          </button>
          <button
            class="btn btn-outline btn-primary"
            @click="$router.push({name: 'camera'})"
          >
            Gå till kamera-vy
          </button>
        </div>
      </div>
    </div>
  </LoggedInLayout>
</template>

<script setup lang="ts">
import LoggedInLayout from '@/components/layout/LoggedInLayout.vue';
import VenueThumb from '@/components/VenueThumb.vue';
import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import { useClientStore } from '@/stores/clientStore';
import { onBeforeMount, ref } from 'vue';

// Stores
const clientStore = useClientStore();

const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
});

// View functionality
async function createVenue () {
  await clientOrThrow.value.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`});
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();

  // clientStore.createVenue();
}

</script>

