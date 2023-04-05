<template>
  <button
    class="btn btn-primary"
  >
    {{ props.venue.name }}
  </button>
</template>

<script setup lang="ts">

import type { ShortVenueInfo } from './VenueList.vue';

// Use imports
// const router = useRouter();
// const venueStore = useVenueStore();

// type VenueInThumbButton = RouterOutputs['admin']['listMyVenues'][number]
// Props & emits
const props = defineProps<{
  venue: ShortVenueInfo,
}>();

// const emit = defineEmits<{
//   (e: 'venuePicked', venue: VenueInThumbButton): void,
// }>();


</script>

<style scoped>

</style>
