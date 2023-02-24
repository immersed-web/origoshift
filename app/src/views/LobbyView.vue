<template>
  <div class="min-h-screen">
    <div class="absolute bottom-5 left-5 z-10">
      <button
        class="btn btn-primary"
      >
        Öppna 360-vy för samtliga deltagare
      </button>
    </div>
    <VrAFrame class="min-h-screen" />
  </div>
</template>

<script setup lang="ts">
import VrAFrame from '../components/Lobby/VrAFrame.vue';
</script>

