<script setup lang="ts">

// Use Material icons
import 'material-icons/iconfont/material-icons.css';

// Register a-frame components
// import components from './ts/aframe/components';
// components.registerAframeComponents();
import('./ts/aframe/components').then((c) => c.default.registerAframeComponents());

</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
