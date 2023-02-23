<template>
  <div>
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">
            Välkommen {{ clientStore.clientState }}
          </h1>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { onMounted } from 'vue';

// import { client } from '@/modules/trpcClient';
import { useClientStore } from '@/stores/clientStore';

// Stores
const clientStore = useClientStore();

// onMounted(() => {

// })

</script>

