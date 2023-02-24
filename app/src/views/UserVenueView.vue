<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          Loaded and joined venue: {{ clientStore.clientState.currentVenueId }}
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useClientStore } from '@/stores/clientStore';
import { useRouter } from 'vue-router';
import { client } from '@/modules/trpcClient';

// Router
const router = useRouter();

// Stores
const clientStore = useClientStore();

// View functionality
onMounted(() => {
  clientStore.updateClientState();
});

const openLobby = async () => {
  await client.value.vr.openVrSpace.mutate();
  await client.value.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

</script>

