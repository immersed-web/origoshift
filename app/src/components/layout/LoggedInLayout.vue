<template>
  <div class="flex flex-col">
    <LoggedInHeader class="flex-none" />
    <ColumnCenter class="mt-10">
      <slot />
    </ColumnCenter>
  </div>
</template>

<script setup lang="ts">

import LoggedInHeader from './LoggedInHeader.vue';
import ColumnCenter from './ColumnCenter.vue';

</script>

<style scoped>

</style>
