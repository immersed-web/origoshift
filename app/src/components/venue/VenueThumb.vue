<template>
  <div class="w-64 transition-all border-2 shadow-xl card bg-base-200 hover:cursor-pointer hover:-translate-y-1">
    <!-- TODO: Show an optional picture here related to the event -->
    <figure class="bg-gradient-to-br from-emerald-600 to-primary h-36">
      <h1 class="text-white card-title">
        {{ props.venue.name }}
      </h1>
    </figure>
    <div class="card-body">
      <p>
        <strong>Dörrarna öppnar:</strong> {{ props.venue.doorsOpeningTime || 'ej angivet' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">

import type { VenueListInfo } from 'schemas';
const props = defineProps<{
  venue: VenueListInfo,
}>();

</script>

<style scoped>

</style>
