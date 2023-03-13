import { defineStore } from 'pinia';
import type { VenueId } from 'schemas';
import type { types as soupTypes } from 'mediasoup-client';
import type { ProducerId } from 'schemas/mediasoup';
import { reactive, ref } from 'vue';

export const useSenderStore = defineStore('sender', () => {
  const savedPickedVenueId = ref<VenueId>();
  const savedPickedDeviceId = ref<string>();
  const savedProducers = reactive<Map<MediaDeviceInfo['deviceId'], {producerId: ProducerId, deviceId: MediaDeviceInfo['deviceId'], type: soupTypes.MediaKind}>>(new Map());


  return {
    savedPickedVenueId,
    savedPickedDeviceId,
    savedProducers,
  };
},
{
  persist: true,
});
