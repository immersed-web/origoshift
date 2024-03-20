<template>
  <div class="h-screen grid place-items-center">
        <div class="card gap-12 items-end bg-base-100 p-12">
          <h2>Utloggad 👍</h2>
          <RouterLink
            class="flex gap-1 items-center text-primary"
            :to="{name: 'enter'}"
          >
            Starta om
            <span class="material-icons">keyboard_arrow_right</span>
          </RouterLink>
        </div>
  </div>
</template>

<script setup lang="ts">

import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
authStore.logout();

</script>

