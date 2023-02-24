<template>
  <div>
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">
            Välkommen {{ clientStore.clientState.userName }}
          </h1>
          <div>
            <h2 class="text-3xl font-bold">
              Dina venues
            </h2>
            <div class="flex">
              <div
                v-for="venue in clientStore.venuesAll"
                :key="venue.venueId"
                class="flex-1"
              >
                <VenueThumb
                  :venue="venue"
                  class="flex-1"
                />
              </div>
              <div>
                <button
                  class="btn btn-outline btn-primary"
                  @click="createVenue"
                >
                  Skapa en ny venue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VenueThumb from '@/components/VenueThumb.vue';
import { useClientStore } from '@/stores/clientStore';

// Stores
const clientStore = useClientStore();

// View functionality
function createVenue () {
  clientStore.createVenue();
}

</script>

