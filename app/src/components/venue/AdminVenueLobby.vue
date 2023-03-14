<template>
  <div>
    <h2 class="card-title">
      VR-lobby
    </h2>
    <button
      class="btn btn-primary"
      @click="openLobby"
    >
      Gå in i VR-lobby
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { clientOrThrow } from '@/modules/trpcClient';
import { useVenueStore } from '@/stores/venueStore';

// Use imports
const router = useRouter();
const venueStore = useVenueStore();

const openLobby = async () => {
  await clientOrThrow.value.vr.openVrSpace.mutate();
  await clientOrThrow.value.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

</script>

