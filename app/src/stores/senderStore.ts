import { defineStore } from 'pinia';
import type { VenueId } from 'schemas';
import { ref } from 'vue';

export const useSenderStore = defineStore('sender', () => {
  const savedVenueId = ref<VenueId>();


  return {
    savedVenueId,
  };
},
{
  persist: true,
});
