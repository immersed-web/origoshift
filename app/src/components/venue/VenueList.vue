<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="venue in props.venues"
      :key="venue.venueId"
    >
      <VenueThumb
        :venue="(venue as VenueListInfo)"
        @click="emit('venuePicked', (venue as VenueListInfo))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VenueThumb from '@/components/venue/VenueThumb.vue';
import type { VenueListInfo } from 'schemas';

const props = defineProps<{ venues: VenueListInfo[]}>();

const emit = defineEmits<{
  (e: 'venuePicked', venue: VenueListInfo): void,
}>();

</script>

<style scoped>

</style>
