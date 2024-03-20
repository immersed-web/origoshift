<template>
  <div class="h-screen grid place-items-center">
        <div class=" card bg-base-100 p-12">
          <h2>Utloggad 👍</h2>
        </div>
  </div>
</template>

<script setup lang="ts">

import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
authStore.logout();

</script>

