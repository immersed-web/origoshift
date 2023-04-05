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
      <div class="form-control w-full max-w-xs mb-2">
        <label class="label">
          <span class="label-text">Synlighet</span>
        </label>
        <div class="btn-group">
          <button
            v-for="vo in venueStore.visibilityOptions"
            :key="vo.visibility"
            type="button"
            class="btn"
            :class="{'btn-primary': vo.visibility === values.visibility}"
            @click="values.visibility = vo.visibility"
          >
            <span class="material-icons mr-2">{{ vo.icon }}</span>
            {{ vo.name }}
          </button>
        </div>
      </div>
      <!-- Lobby/VR start time -->
      <div class="form-control w-full max-w-xs mb-2">
        <label class="label">
          <span class="label-text">Dörrarna/VR-lobbyn öppnar</span>
          <span class="material-icons">meeting_room</span>
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
          <span class="label-text">Eventet/360-sändningen startar</span>
          <span class="material-icons">curtains</span>
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
import type { Visibility } from 'database';
import { type Ref, ref, onMounted } from 'vue';

// Use imports
const venueStore = useVenueStore();

const updateVenue = async () => {
  if(venueStore.currentVenue){
    venueStore.updateVenue(
      values.value.name,
      values.value.visibility,
      values.value.doorsOpeningTime ? new Date(values.value.doorsOpeningTime) : undefined,
      values.value.streamStartTime ? new Date(values.value.streamStartTime) : undefined,
    );
  }
};

// type OptionWithExtras = {
//   option: Visibility,
//   description: string,
//   icon: string
// }
// // const v : Visibility[] = ['private', 'unlisted', 'public'];
// const visibilityOptions : Ref<OptionWithExtras[]> = ref([
//   {
//     option: 'private',
//     description: 'Privat',
//     icon: 'lock',
//   },
//   {
//     option: 'unlisted',
//     description: 'Länk',
//     icon: 'link',
//   },
//   {
//     option: 'public',
//     description: 'Publik',
//     icon: 'list',
//   },
// ] as OptionWithExtras[]);


// TODO: Shouldn't have to redefine VenueUpdate type
const values = ref<{
  name?: string,
  visibility?: Visibility,
  doorsOpeningTime?: string,
  streamStartTime?: string
}>({});

// TODO: could this perhaps fail? Should computed or watcher be used?
onMounted(() => {
  values.value.name = venueStore.currentVenue?.name;
  values.value.visibility = venueStore.currentVenue?.visibility;
  values.value.doorsOpeningTime = venueStore.currentVenue?.doorsOpeningTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.doorsOpeningTime?.toLocaleTimeString();
  values.value.streamStartTime = venueStore.currentVenue?.streamStartTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.streamStartTime?.toLocaleTimeString();
});


</script>

