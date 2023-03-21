import { defineStore } from 'pinia';
import type { CameraId, VenueId } from 'schemas';
import type { types as soupTypes } from 'mediasoup-client';
import type { ProducerId } from 'schemas/mediasoup';
import { reactive, ref, shallowRef } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';

type ReceivedSenderState = SubscriptionValue<RouterOutputs['sender']['subOwnClientState']>['myState']
export const useSenderStore = defineStore('sender', () => {
  const savedPickedVenueId = ref<VenueId>();
  const savedPickedDeviceId = ref<string>();
  const senderState = ref<ReceivedSenderState>();
  // const savedProducers = reactive<Map<MediaDeviceInfo['deviceId'], {producerId: ProducerId, deviceId: MediaDeviceInfo['deviceId'], type: soupTypes.MediaKind}>>(new Map());
  const cameraId = ref<CameraId>();

  const connection = useConnectionStore();
  connection.client.sender.subOwnClientState.subscribe(undefined, {
    onData(data){
      senderState.value = data.myState;
    },
  });

  return {
    savedPickedVenueId,
    savedPickedDeviceId,
    // savedProducers,
    cameraId,
  };
},
{
  persist: true,
});
