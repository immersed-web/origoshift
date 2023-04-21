import { defineStore } from 'pinia';
import type { SenderId, CameraId, VenueId } from 'schemas';
import type { types as soupTypes } from 'mediasoup-client';
import type { ProducerId } from 'schemas/mediasoup';
import { reactive, ref, shallowRef } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';

type ReceivedSenderState = SubscriptionValue<RouterOutputs['sender']['subOwnClientState']>['myState']
export const useSenderStore = defineStore('sender', () => {
  const savedPickedDeviceId = ref<string>();
  const senderState = ref<ReceivedSenderState>();
  const senderId = ref<SenderId>();
  // const savedProducers = reactive<Map<MediaDeviceInfo['deviceId'], {producerId: ProducerId, deviceId: MediaDeviceInfo['deviceId'], type: soupTypes.MediaKind}>>(new Map());
  const cameraId = ref<CameraId>();

  const connection = useConnectionStore();
  connection.client.sender.subOwnClientState.subscribe(undefined, {
    onData(data){
      console.log('received new senderstate:', data);
      senderState.value = data.myState;
      senderId.value = senderState.value.senderId;
    },
  });

  const _initSenderId = async (sId?: SenderId) => {
    if(sId) {
      console.log('GONNA SEND MY SENDERID TO SERVER!!!');
      connection.client.sender.setSenderId.mutate(sId);
    } else {
      console.log('GONNA FETCH MY SENDERID FROM SERVER!!!');
      const state = await connection.client.sender.getClientState.query();
      senderId.value = state.senderId;
    }
  };

  return {
    /**
     * @internal
     * Should usually not be called. Used inside the store.
     * Helps in syncing of senderId between server instance and localstorage.
     * If given an id it sends it to backend. If undefined it fetches from backend.
     */
    _initSenderId,
    senderId,
    savedPickedDeviceId,
    // savedProducers,
    cameraId,
  };
},
{
  persist: {
    afterRestore(ctx) {
      console.log('AFTER RESTORE:', ctx.store);
      ctx.store._initSenderId(ctx.store.senderId);
    },
  },
});
