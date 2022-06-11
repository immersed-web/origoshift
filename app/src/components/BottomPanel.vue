<template>
  <QToolbar
    id="bottom-panel"
    class="bg-dark q-gutter-x-lg"
  >
    <slot />
  </QToolBar>
</template>

<script setup lang="ts">
</script>

<style lang="scss">

// TODO: make margins for bottom panel correct! its related to gutter and such
#bottom-panel {
  z-index: 1000;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  // width: 100vw;
}

// #toolbar {
//   width: 100%;
// }
</style>
