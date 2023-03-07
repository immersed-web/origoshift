<template>
  <div>
    <h1 class="text-5xl font-bold">
      Välkommen {{ clientStore.clientState.userName }}
    </h1>
    <div>
      <h2 class="text-3xl font-bold">
        Mina event
      </h2>
      <div class="flex space-x-2">
        <VenueList />
        <div>
          <button
            class="btn btn-outline btn-primary"
            @click="createVenue"
          >
            Skapa ett nytt event
          </button>
        </div>
      </div>
    </div>
    <pre>{{ myVenues }}</pre>
    <pre>{{ loadedVenues }}</pre>
    <button
      class="btn btn-outline btn-primary"
      @click="$router.push({name: 'camera'})"
    >
      Gå till kamera-vy
    </button>
  </div>
</template>

<script setup lang="ts">
import LoggedInLayout from '@/layouts/LoggedInLayout.vue';
import VenueList from '@/components/venue/VenueList.vue';
import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import { useClientStore } from '@/stores/clientStore';
import { onBeforeMount, ref } from 'vue';

// Stores
const clientStore = useClientStore();

const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
});

const loadedVenues = ref<RouterOutputs['venue']['listLoadedVenues']>();
onBeforeMount(async () => {
  loadedVenues.value = await clientOrThrow.value.venue.listLoadedVenues.query();
});

// View functionality
async function createVenue () {
  await clientOrThrow.value.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`});
  myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();

  // clientStore.createVenue();
}

</script>
