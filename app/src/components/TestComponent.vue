<script setup lang="ts">
defineProps<{
  msg: string
}>();
</script>

<template>
  <div class="bg-teal-800">
    YESTING TESTING FESTING {{ msg }}
    <slot />
  </div>
</template>

<style scoped>
</style>
