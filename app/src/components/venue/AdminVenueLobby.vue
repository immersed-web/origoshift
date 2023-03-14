<template>
  <div>
    <div class="flex mb-4">
      <h2 class="flex-1 card-title">
        VR-lobby
      </h2>
      <button
        class="btn btn-primary"
        @click="openLobby"
      >
        Gå in i VR-lobby
      </button>
    </div>
    <div>
      Inställningar för VR-lobby...
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';

// Use imports
const router = useRouter();
const connectionStore = useConnectionStore();

const openLobby = async () => {
  await connectionStore.client.vr.openVrSpace.mutate();
  await connectionStore.client.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

</script>

