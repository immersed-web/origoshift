<template>
  <div>
    <h2>
      Grundinställningar
    </h2>
    <form
      v-if="venueStore.currentVenue"
      @submit.prevent="updateVenue"
    >
      <div class="w-full max-w-xs mb-2 form-control">
        <label class="label">
          <span class="label-text">Eventets namn</span>
        </label>
        <input
          v-model="values.name"
          type="text"
          placeholder="Eventets namn"
          class="w-full max-w-xs input input-bordered"
        >
      </div>
      <div class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border">
        <div class="flex justify-between mb-2">
          <span class="label-text text-base">Synlighet</span>
          <span class="material-icons">visibility</span>
        </div>
        <div class="btn-group w-full">
          <button
            v-for="vo in venueStore.visibilityOptions"
            :key="vo.visibility"
            type="button"
            class="btn btn-sm"
            :class="{'btn-primary': vo.visibility === values.visibility}"
            @click="values.visibility = vo.visibility"
          >
            <span class="mr-2 material-icons">{{ vo.icon }}</span>
            {{ vo.name }}
          </button>
        </div>
      </div>

      <!-- Lobby/VR start time -->
      <div class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border">
        <div class="flex justify-between mb-2">
          <span class="label-text text-base">Lobby</span>
          <span class="material-icons">nightlife</span>
        </div>
        <label class="label flex justify-start gap-2 pl-0">
          <span class="label-text">Lobbyn öppnar innan sändningen: </span>
          <input
            class="mr-2 toggle toggle-primary toggle-sm"
            type="checkbox"
            v-model="useDoorsOpenTime"
          >
          <!-- <span class="material-icons">meeting_room</span> -->
        </label>
        <div
          class="pl-2 text-sm"
          v-auto-animate
        >
          <!-- <input
            class="mr-2 toggle toggle-primary"
            type="checkbox"
            v-model="useDoorsOpenTime"
          > -->
          <div v-if="useDoorsOpenTime">
            Ange tiden då lobbyn öppnar. Tiden är synlig för besökarna.
            <input
              v-model="values.doorsOpeningTime"
              type="datetime-local"
              placeholder="Startdatum och -tid"
              class="w-full max-w-xs input input-bordered"
            >
            <label class="label flex justify-start gap-2">
              <span class="label-text">Öppna automatiskt vid utsatt tid: </span>
              <input
                class="mr-2 toggle toggle-primary toggle-sm"
                type="checkbox"
                v-model="values.doorsAutoOpen"
              >
              <!-- <span class="material-icons">meeting_room</span> -->
            </label>
          </div>
          <!-- <div
            v-else
            class="mb-2"
          >
            Dörrarna öppnar när eventet startar.
          </div> -->
        </div>
        <!-- Ni kan när som helst öppna lobbyn manuellt. -->
      </div>

      <!-- Event streaming start time -->
      <div class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border">
        <div class="flex justify-between mb-2">
          <span class="label-text text-base">360-sändning</span>
          <span class="material-icons">curtains</span>
        </div>
        <div>
          Ange tiden då 360-sändningen startar. Tiden är synlig för besökarna.
          <input

            v-model="values.streamStartTime"
            type="datetime-local"
            placeholder="Startdatum och -tid"
            class="w-full max-w-xs input input-bordered"
          >
          <label class="label flex justify-start gap-2">
            <span class="label-text">Starta automatiskt vid utsatt tid: </span>
            <input
              class="mr-2 toggle toggle-primary toggle-sm"
              type="checkbox"
              v-model="values.streamAutoStart"
            >
            <!-- <span class="material-icons">meeting_room</span> -->
          </label>
        </div>
        <!-- <div class="w-full max-w-xs mb-2 form-control">
        <label class="label">
          <span class="label-text">Eventet/360-sändningen startar</span>
          <span class="material-icons">curtains</span>
        </label>
        <input
          v-model="values.streamStartTime"
          type="datetime-local"
          placeholder="Startdatum och -tid"
          class="w-full max-w-xs input input-bordered"
        >
      </div> -->
      </div>
      <div class="w-full max-w-xs form-control">
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
import { useConnectionStore } from '@/stores/connectionStore';
import { ref, onMounted } from 'vue';
import type { VenueUpdate } from 'schemas/esm';

// Use imports
const venueStore = useVenueStore();
const connection = useConnectionStore();

const updateVenue = async () => {
  if(venueStore.currentVenue){

    console.log(useDoorsOpenTime.value, values.value.doorsOpeningTime);

    await connection.client.admin.updateVenue.mutate({
      name: values.value.name,
      visibility: values.value.visibility,
      doorsOpeningTime: useDoorsOpenTime.value && values.value.doorsOpeningTime ? new Date(values.value.doorsOpeningTime) : null,
      doorsAutoOpen: useDoorsOpenTime.value && values.value.doorsOpeningTime ? values.value.doorsAutoOpen : false,
      streamStartTime: values.value.streamStartTime ? new Date(values.value.streamStartTime) : null,
      streamAutoStart: values.value.streamStartTime ? values.value.streamAutoStart : false,
    });
  }
};

type DatesAsStrings<T extends Record<string, unknown>> = {
  [K in keyof T]: Date extends T[K] ? Exclude<T[K], Date> | string: T[K]
}

const values = ref<DatesAsStrings<VenueUpdate>>({});

// TODO: could this perhaps fail? Should computed or watcher be used?
onMounted(() => {
  values.value.name = venueStore.currentVenue?.name;
  values.value.visibility = venueStore.currentVenue?.visibility;
  useDoorsOpenTime.value = !!venueStore.currentVenue?.doorsOpeningTime;
  values.value.doorsOpeningTime = venueStore.currentVenue?.doorsOpeningTime ? venueStore.currentVenue?.doorsOpeningTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.doorsOpeningTime?.toLocaleTimeString() : undefined;
  values.value.doorsAutoOpen = venueStore.currentVenue?.doorsAutoOpen;
  values.value.streamStartTime = venueStore.currentVenue?.streamStartTime ?  venueStore.currentVenue?.streamStartTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.streamStartTime?.toLocaleTimeString() : undefined;
  values.value.streamAutoStart = venueStore.currentVenue?.streamAutoStart;
});

const useDoorsOpenTime = ref(false);



</script>

