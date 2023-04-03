<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="venue in props.venues"
      :key="venue.venueId"
    >
      <VenueThumb
        :venue="venue"
        @joined="joined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VenueThumb from '@/components/venue/VenueThumb.vue';
import { useAuthStore } from '@/stores/authStore';
import type { VenueId } from 'schemas';

const props = defineProps<{ venues: {venueId: VenueId, name: string}[]}>();

// Use imports
const router = useRouter();
const authStore = useAuthStore();

const joined = async () => {
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>

<style scoped>

</style>
