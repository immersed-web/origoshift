<template>
  <div>
    <h1 class="mb-4 text-5xl font-bold">
      Välkommen {{ clientStore.clientState?.username }}
    </h1>
    <div>
      <h2 class="mb-2 text-3xl font-bold">
        Mina event
      </h2>
      <div class="flex space-x-2">
        <VenueList
          v-if="clientStore.clientState"
          :venues="venuesAsArray"
          @venue-picked="(venue) => pickVenueAndNavigate(venue.venueId as VenueId)"
        />
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
    <!-- <button
      class="btn btn-outline btn-primary"
      @click="$router.push({name: 'camera'})"
    >
      Gå till kamera-vy
    </button> -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VenueList from '@/components/venue/VenueList.vue';
import type { RouterOutputs } from '@/modules/trpcClient';
import { useClientStore } from '@/stores/clientStore';
import { useAuthStore } from '@/stores/authStore';
import { useVenueStore } from '@/stores/venueStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { computed, onBeforeMount, ref } from 'vue';
import type { VenueId } from 'schemas/*';
import { useAdminStore } from '@/stores/adminStore';

// Use imports
const router = useRouter();
const connectionStore = useConnectionStore();
const clientStore = useClientStore();
const authStore = useAuthStore();
const venueStore = useVenueStore();
const adminStore = useAdminStore();

const venuesAsArray = computed(() => {
  if(!clientStore.clientState) return [];
  return Object.values(clientStore.clientState?.ownedVenues);
});

const myVenues = ref<RouterOutputs['admin']['listMyVenues']>();
onBeforeMount(async () => {
  myVenues.value = await connectionStore.client.admin.listMyVenues.query();
});

const loadedVenues = ref<RouterOutputs['venue']['listLoadedVenues']>();
onBeforeMount(async () => {
  loadedVenues.value = await connectionStore.client.venue.listLoadedVenues.query();
});

// View functionality
async function createVenue () {
  await adminStore.createVenue();
  router.push({name: authStore.routePrefix + 'Venue'});

  // clientStore.createVenue();
}

const pickVenueAndNavigate = async (venueId: VenueId) => {
  venueStore.savedVenueId = venueId;
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>
