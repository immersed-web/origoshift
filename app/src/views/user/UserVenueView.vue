<template>
  <div>
    <h1 v-if="!clientStore.clientState?.currentVenueId">
      Venue not loaded
    </h1>
    <h1
      v-else
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
</template>

<script setup lang="ts">
import { useClientStore } from '@/stores/clientStore';
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';
import type { VenueId } from 'schemas';
import { onMounted } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
const connection = useConnectionStore();
const venueStore = useVenueStore();

const props = defineProps<{
  venueId: VenueId
}>();

onMounted(() =>{
  venueStore.joinVenue(props.venueId);
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

