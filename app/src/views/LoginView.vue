<template>
  <div>
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">
            Välkommen till OrigoShift
          </h1>
          <p class="py-6">
            Logga in för att ta del av kulturevenemang i VR.
          </p>
          <button
            class="btn btn-primary"
            @click="loginAsAdmin"
          >
            Nu kör vi!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

// Imports
import { useRouter } from 'vue-router';
import { useClientStore } from '@/stores/clientStore';

// Router
const router = useRouter();

// Stores
const clientStore = useClientStore();

// View / components functionality
const loginAsAdmin = async () => {
  await clientStore.loginAsAdmin();
  router.push({name: 'userHome'});
};


</script>

