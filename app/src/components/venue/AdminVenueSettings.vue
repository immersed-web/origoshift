<template>
  <div class="prose">
    <h2>
      Grundinställningar
    </h2>
    <form
      v-if="venueStore.currentVenue"
      @submit.prevent="updateVenue"
    >
      <div class="form-control w-full max-w-xs mb-2">
        <label class="label">
          <span class="label-text">Eventets namn</span>
        </label>
        <input
          v-model="venueStore.currentVenue.name"
          type="text"
          placeholder="Eventets namn"
          class="input input-bordered w-full max-w-xs"
        >
      </div>
      <div class="form-control w-full max-w-xs">
        <button
          type="submit"
          class="btn btn-primary"
        >
          Spara
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useVenueStore } from '@/stores/venueStore';

// Use imports
const venueStore = useVenueStore();

const updateVenue = async () => {
  if(venueStore.currentVenue){
    venueStore.updateVenue();
  }
};

</script>

