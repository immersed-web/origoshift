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

<script setup lang="ts">
import VenueThumb from '@/components/venue/VenueThumb.vue';
import type { VenueId, VenueListInfo } from 'schemas';
import type { RouterOutputs } from '@/modules/trpcClient';

const props = defineProps<{ venues: VenueListInfo[]}>();

const emit = defineEmits<{
  (e: 'venuePicked', venue: VenueListInfo): void,
}>();

</script>

<style scoped>

</style>
