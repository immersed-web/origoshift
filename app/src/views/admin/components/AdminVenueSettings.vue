<template>
  <div>
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
          v-model="values.name"
          type="text"
          placeholder="Eventets namn"
          class="input input-bordered w-full max-w-xs"
        >
      </div>
      <!-- Lobby/VR start time -->
      <div class="form-control w-full max-w-xs mb-2">
        <label class="label">
          <span class="label-text">Dörrarna/VR-lobbyn öppnar</span>
        </label>
        <input
          v-model="values.doorsOpeningTime"
          type="datetime-local"
          placeholder="Startdatum och -tid"
          class="input input-bordered w-full max-w-xs"
        >
      </div>
      <!-- Event streaming start time -->
      <div class="form-control w-full max-w-xs mb-2">
        <label class="label">
          <span class="label-text">Eventet/360-videon startar</span>
        </label>
        <input
          v-model="values.streamStartTime"
          type="datetime-local"
          placeholder="Startdatum och -tid"
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
import { ref, onMounted } from 'vue';

// Use imports
const venueStore = useVenueStore();

const updateVenue = async () => {
  if(venueStore.currentVenue){
    venueStore.updateVenue(
      values.value.name,
      values.value.doorsOpeningTime ? new Date(values.value.doorsOpeningTime) : undefined,
      values.value.streamStartTime ? new Date(values.value.streamStartTime) : undefined,
    );
  }
};

// TODO: Shouldn't have to redefine VenueUpdate type
const values = ref<{name?: string, doorsOpeningTime?: string, streamStartTime?: string}>({});
onMounted(() => {
  values.value.name = venueStore.currentVenue?.name;
  values.value.doorsOpeningTime = venueStore.currentVenue?.doorsOpeningTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.doorsOpeningTime?.toLocaleTimeString();
  values.value.streamStartTime = venueStore.currentVenue?.streamStartTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.streamStartTime?.toLocaleTimeString();
});


</script>

