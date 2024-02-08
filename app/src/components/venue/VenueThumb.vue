<template>
  <div class="w-128 transition-all border-2 shadow-xl card bg-base-200 hover:cursor-pointer hover:-translate-y-1">
    <!-- TODO: Show an optional picture here related to the event -->
    <figure class="bg-gradient-to-br from-primary/35 to-primary h-24">
      <h1 class="text-primary-content card-title drop-shadow-sm">
        {{ props.venue.name }}
      </h1>
    </figure>
    <div class="card-body">
      <div>
        <div class="flex items-center">
          <span class="material-icons mr-3">curtains</span>
          <div>
            <strong>Sändningen startar</strong>
            <br>
            {{ props.venue.streamStartTime?.toLocaleString() || 'ej angivet' }}
          </div>
        </div>
      </div>
      <div v-if="props.venue.doorsOpeningTime">
        <div class="flex items-center">
          <span class="material-icons mr-3">nightlife</span>
          <div>
            <strong>Lobbyn öppnar</strong>
            <br>
            {{ props.venue.doorsOpeningTime.toLocaleString() }}
          </div>
        </div>
      </div>
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
