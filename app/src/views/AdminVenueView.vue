<template>
  <div>
    <h1 class="text-5xl font-bold">
      Loaded and joined venue: {{ clientStore.clientState.currentVenueId }}
    </h1>
    <div>
      <h2>Inställningar för eventet</h2>
      <pre>
        {{ venueStore.currentVenue }}
      </pre>
      <!-- <form>
        <input v-model="venueStore.currentVenue" type="text" />
      </form> -->
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
import { onMounted } from 'vue';
import { useClientStore } from '@/stores/clientStore';
import { useVenueStore } from '@/stores/venueStore';
import { useRouter } from 'vue-router';
import { clientOrThrow } from '@/modules/trpcClient';

// Router
const router = useRouter();

// Stores
const clientStore = useClientStore();
const venueStore = useVenueStore();

// View functionality
onMounted(() => {
  clientStore.updateClientState();
});

const openLobby = async () => {
  await clientOrThrow.value.vr.openVrSpace.mutate();
  await clientOrThrow.value.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

</script>

