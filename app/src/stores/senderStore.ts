import { defineStore } from 'pinia';
import type { VenueId } from 'schemas';
import { ref } from 'vue';

export const useSenderStore = defineStore('sender', () => {
  const savedPickedVenueId = ref<VenueId>();
  const savedPickedDeviceId = ref<string>();


  return {
    savedPickedVenueId,
    savedPickedDeviceId,
  };
},
{
  persist: true,
});
