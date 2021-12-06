<template>
  <q-page class="row items-center justify-evenly">
    <h2>Caaannect??? {{ connectionStore.connected }}</h2>
  </q-page>
</template>

<script setup lang="ts">
import { useConnectionStore } from 'src/stores/connection';

const connectionStore = useConnectionStore();
</script>
