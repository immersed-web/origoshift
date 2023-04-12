<template>
  <div class="flex flex-col">
    <LoggedInHeader
      v-if="authStore.isNotGuest"
      class="flex-none"
    />
    <ColumnCenter class="mt-10">
      <RouterView />
    </ColumnCenter>
  </div>
</template>

<script setup lang="ts">

import { useAuthStore } from '@/stores/authStore';

import LoggedInHeader from '@/components/layout/LoggedInHeader.vue';
import ColumnCenter from '@/components/layout/ColumnCenter.vue';

const authStore = useAuthStore();

</script>

<style scoped>

</style>
