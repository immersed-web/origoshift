<template>
  <div>
    <div v-if="!clientStore.clientState?.currentVenueId">
      <h1 class="my-6">
        Väntar på att eventet öppnar...
      </h1>
      <div>
        <p v-if="venueInfo.doorsOpeningTime">
          Dörrarna öppnas: {{ venueInfo.doorsOpeningTime }}
        </p>
      </div>
    </div>
    <div
      v-else
    >
      <h1
        class="text-5xl font-bold"
      >
        Loaded and joined venue: {{ clientStore.clientState?.currentVenueId }}
      </h1>
      <div class="flex space-x-2">
        <button
          class="btn btn-primary"
          @click="openLobby"
        >
          Gå in i VR-lobby
        </button>
        <button
          class="btn btn-primary"
        >
          Gå in i 360
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClientStore } from '@/stores/clientStore';
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';
import type { VenueId, VenueListInfo } from 'schemas';
import { onMounted, shallowRef } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
import { useIntervalFn } from '@vueuse/core';
const connection = useConnectionStore();
const venueStore = useVenueStore();

const props = defineProps<{
  venueId: VenueId
}>();

const venueInfo = shallowRef<VenueListInfo>({});

const { pause } = useIntervalFn(async () => {
  try {
    await venueStore.joinVenue(props.venueId);
    pause();
  }catch(e){
    console.error(e);
    console.log('failed to join venue. Will retry soon.');
  }

}, 5000);
onMounted(async () =>{
  venueInfo.value = await connection.client.venue.getVenueListInfo.query({venueId: props.venueId});
});
// Router
const router = useRouter();

// Stores
const clientStore = useClientStore();

const openLobby = async () => {
  await connection.client.vr.openVrSpace.mutate();
  await connection.client.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

</script>

