<template>
  <div class="flex flex-col">
    <LoggedInHeader
      class="flex-none"
    />
    <ColumnCenter class="mt-10">
      <RouterView />
    </ColumnCenter>
  </div>
</template>

<script setup lang="ts">

import LoggedInHeader from '@/components/layout/LoggedInHeader.vue';
import ColumnCenter from '@/components/layout/ColumnCenter.vue';

</script>

<style scoped>

</style>
