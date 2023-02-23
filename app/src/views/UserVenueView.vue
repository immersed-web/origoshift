<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          Loaded and joined venue: {{ clientStore.clientState.currentVenueId }}
        </h1>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { onMounted } from 'vue';

// import { client } from '@/modules/trpcClient';
// import VenueOverview from '@/components/VenueOverview.vue';
import { useClientStore } from '@/stores/clientStore';
import { onMounted } from 'vue';

// Stores
const clientStore = useClientStore();

// View functionality
onMounted(() => {
  clientStore.updateClientState();
});

</script>

