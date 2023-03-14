<script setup lang="ts">

// Use Material icons
import 'material-icons/iconfont/material-icons.css';

// Register a-frame components
import components from './ts/aframe/components';
components.registerAframeComponents();

</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
