<template>
  <div>
    <h1 class="text-5xl font-bold">
      Loaded and joined venue: {{ venueStore.currentVenue?.name }}
    </h1>
    <div>
      <h2>Inställningar för eventet</h2>
      <form
        v-if="venueStore.currentVenue"
        @submit.prevent="updateVenue"
      >
        <input
          v-model="venueStore.currentVenue.name"
          type="text"
        >
        <button type="submit">
          Uppdatera
        </button>
      </form>
      <pre>
        {{ venueStore.currentVenue }}
      </pre>
    </div>
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
</template>

<script setup lang="ts">
import { onMounted, shallowReactive } from 'vue';
import { useRouter } from 'vue-router';
import { useClientStore } from '@/stores/clientStore';
import { useVenueStore } from '@/stores/venueStore';
import { useConnectionStore } from '@/stores/connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';

// Router
const router = useRouter();

// Stores
const connectionStore = useConnectionStore();
const clientStore = useClientStore();
const venueStore = useVenueStore();

// Refs
type ReceivedSenderData = SubscriptionValue<RouterOutputs['venue']['subSenderAddedOrRemoved']>['client'];
const connectedSenders = shallowReactive<Map<ReceivedSenderData['connectionId'], ReceivedSenderData>>(new Map());

// View functionality
onMounted(() => {
  clientStore.updateClientState();
  connectionStore.client.venue.subSenderAddedOrRemoved.subscribe(undefined, {
    onData(data) {
      const client = data.client;
      if(data.added){
        connectedSenders.set(client.connectionId ,client);
      } else {
        connectedSenders.delete(client.connectionId);
      }
    },
  });
});

const openLobby = async () => {
  await connectionStore.client.vr.openVrSpace.mutate();
  await connectionStore.client.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

const updateVenue = async () => {
  if(venueStore.currentVenue){
    console.log('Update venue', venueStore.currentVenue?.name);
    venueStore.updateVenue();
  }
};

</script>

