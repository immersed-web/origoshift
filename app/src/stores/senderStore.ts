import { defineStore } from 'pinia';
import type { SenderId, CameraId, VenueId, CameraFOVUpdate } from 'schemas';
import type { types as soupTypes } from 'mediasoup-client';
import type { ProducerId } from 'schemas/mediasoup';
import { reactive, ref, shallowRef, toRaw } from 'vue';
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
    onData({data, reason}){
      console.log(`received new senderstate (${reason}):`, data);
      senderState.value = data;
      senderId.value = senderState.value.senderId;
      cameraId.value = data.cameraId;
    },
  });

  const initSenderId = async () => {
    if(senderId.value) {
      console.log('GONNA SEND MY SENDERID TO SERVER!!!');
      connection.client.sender.setSenderId.mutate(senderId.value);
    } else {
      console.log('GONNA FETCH MY SENDERID FROM SERVER!!!');
      const state = await connection.client.sender.getClientState.query();
      senderId.value = state.senderId;
      cameraId.value = state.cameraId;
    }
  };
  
  async function setFOVForCamera(data: CameraFOVUpdate){
    await connection.client.sender.setCameraFOV.mutate(data);
  }

  return {
    /**
     * @internal
     * Should usually not be called. Used inside the store.
     * Helps in syncing of senderId between server instance and localstorage.
     * If an id exists it sends it to backend. If undefined it fetches from backend.
     */
    initSenderId,
    setFOVForCamera,
    senderId,
    savedPickedDeviceId,
    // savedProducers,
    cameraId,
  };
},
{
  persist: {
    afterRestore(ctx) {
      console.log('AFTER RESTORE:', toRaw(ctx.store));
      ctx.store.initSenderId();
    },
  },
});
