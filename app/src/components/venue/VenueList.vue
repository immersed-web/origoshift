<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="venue in props.venues"
      :key="venue.venueId"
    >
      <VenueThumb
        :venue="venue"
        @click="emit('venuePicked', venue)"
      />
    </div>
  </div>
</template>

<script lang="ts">
export type ShortVenueInfo = RouterOutputs['admin']['listMyVenues'][number];
</script>
<script setup lang="ts">
import VenueThumb from '@/components/venue/VenueThumb.vue';
import type { VenueId } from 'schemas';
import type { RouterOutputs } from '@/modules/trpcClient';

const props = defineProps<{ venues: {venueId: VenueId, name: string}[]}>();

const emit = defineEmits<{
  (e: 'venuePicked', venue: ShortVenueInfo): void,
}>();

</script>

<style scoped>

</style>
