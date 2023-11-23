<template>
  <div>
    <h1 class="text-5xl font-bold my-2">
      {{ venueInfo?.name }}
    </h1>

    <div v-if="!venueStore.currentVenue">
      <div>
        <div class="alert alert-warning">
          <div>
            <span class="material-icons">
              warning
            </span>
            Eventet är inte igång.
          </div>
        </div>
        <h2>Eventets hålltider</h2>
        <p v-if="venueInfo?.doorsOpeningTime">
          <strong>Lobbyn öppnar:</strong> {{ venueInfo.doorsOpeningTime.toLocaleString() }}
        </p>
        <p v-if="venueInfo?.streamStartTime">
          <strong>Sändningen startar:</strong> {{ venueInfo.streamStartTime.toLocaleString() }}
        </p>

        <p v-if="venueInfo?.doorsOpeningTime && !isPast(venueInfo.doorsOpeningTime)">
          Behåll denna sida öppen för att automatiskt slussas in i eventet när det startar.
        </p>
      </div>
    </div>
    <div
      v-else
    >
      <div class="flex space-x-2">
        <div class="flex-1">
          <div v-if="venueStore.currentVenue.vrSpace">
            <h2>VR-lobby</h2>

            <span
              class="material-icons text-sm"
              :class="venueStore.currentVenue?.doorsAreOpen ? 'text-green-500' : 'text-red-500'"
            >circle</span>
            <strong>Lobbyn är {{ venueStore.currentVenue?.doorsAreOpen ? 'öppen' : 'stängd' }}</strong>

            <div v-if="venueStore.currentVenue.doorsAreOpen">
              <p>Gå in i eventets VR-lobby och träffa andra besökare till detta event. Du kan använda ett VR-headset eller mus och tangentbord.</p>
              <button
                class="btn btn-primary"
                @click="openLobby"
              >
                Gå in i VR-lobby
              </button>
            </div>
            <div v-else-if="venueStore.currentVenue.doorsOpeningTime">
              <strong>Lobbyn öppnar:</strong> {{ venueStore.currentVenue.doorsOpeningTime?.toLocaleString() }}
            </div>
          </div>
        </div>
        <div class="flex-1">
          <span
            class="material-icons text-sm"
            :class="venueStore.currentVenue?.streamIsActive ? 'text-green-500' : 'text-red-500'"
          >circle</span>
          <strong>Sändningen är {{ venueStore.currentVenue?.streamIsActive ? 'igång' : 'ej igång' }}</strong>

          <div v-if="venueStore.currentVenue.streamIsActive">
            <p>360-sändning blahi blaha</p>
            <button
              v-for="camera in venueStore.currentVenue.cameras"
              :key="camera.cameraId"
              @click="router.push({name: 'userCamera', params: {venueId: props.venueId, cameraId: camera.cameraId}})"
              class="btn btn-primary"
            >
              {{ camera.name }}
            </button>
          </div>
          <div v-else-if="venueStore.currentVenue.streamStartTime">
            <strong>Sändningen startar:</strong> {{ venueStore.currentVenue.streamStartTime?.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';
import type { VenueId, VenueListInfo } from 'schemas';
import { onMounted, shallowRef } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
import { useIntervalFn } from '@vueuse/core';
import { isPast } from 'date-fns';
const connection = useConnectionStore();
const venueStore = useVenueStore();

const props = defineProps<{
  venueId: VenueId
}>();

const venueInfo = shallowRef<VenueListInfo>();

if(venueStore.currentVenue?.venueId !== props.venueId){
  const { pause } = useIntervalFn(async () => {
    try {
      console.log('trying to join venue:', props.venueId);
      // await venueStore.joinVenue(props.venueId);
      await venueStore.loadAndJoinVenue(props.venueId);
      pause();
    }catch(e){
      console.error(e);
      console.log('failed to join venue. Will retry soon.');
    }

  }, 5000, { immediateCallback: true});
}
onMounted(async () =>{
  venueInfo.value = await connection.client.venue.getVenueListInfo.query({venueId: props.venueId});
});
// Router
const router = useRouter();

// Stores
// const clientStore = useClientStore();

const openLobby = async () => {
  // TODO: should we perhaps do this on entering vr instead?
  router.push({name: 'userLobby'});
};

</script>

