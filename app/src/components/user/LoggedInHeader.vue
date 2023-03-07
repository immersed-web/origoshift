<template>
  <div class="flex p-4 bg-primary text-base-100">
    <div class="">
      Client state: {{ clientStore.clientState }}
    </div>
    <button
      class="btn"
      @click="logout"
    >
      Logga ut
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useClientStore } from '@/stores/clientStore';
import type { log } from 'console';

const router = useRouter();

const authStore = useAuthStore();
const clientStore = useClientStore();

const logout = async () => {
  await authStore.logout();
  console.log('was logged out');
  router.push({path: '/', force: true});
};

</script>

<style scoped>

</style>
