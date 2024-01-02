import { defineStore } from 'pinia';

import type { ClientTransform, ConnectionId } from 'schemas';
import { ref } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';
import { useClientStore } from './clientStore';

export const useVrSpaceStore = defineStore('vrSpace', () => {
  
  const connection = useConnectionStore();
  const clientStore = useClientStore();

  const currentVrSpace = ref<SubscriptionValue<RouterOutputs['vr']['subVrSpaceStateUpdated']>['data']>();


  connection.client.vr.subVrSpaceStateUpdated.subscribe(undefined, {
    onData(vrSpaceState) {
      console.log(`vrSpaceState updated. ${vrSpaceState.reason}:`, vrSpaceState.data);
      currentVrSpace.value = vrSpaceState.data;
    },
  });
  
  connection.client.vr.transform.subClientTransforms.subscribe(undefined, {
    onData(subscribeValue) {
      if(!currentVrSpace.value) return;
      console.log('clientTransforms update received:', subscribeValue.data);
      for(const [cId, tsfm] of Object.entries(subscribeValue.data)) {
        const cIdTyped = cId as ConnectionId;
        // if(cId === clientStore.clientState?.connectionId){
        //   continue;
        // }
        // TODO: why should we skip ourselves. We wont perhaps use it, but if we did we would at least have our own latest transform
        if(clientStore.clientState?.connectionId === cId){
          // console.log('skipping because is own transform. cId:', cId);
          continue;
        }
        if(!currentVrSpace.value.clients[cIdTyped]){
          console.warn('received a clientTransform for a client that isnt listed in vrSpaceState');
          return;
        }
        currentVrSpace.value.clients[cId as ConnectionId].transform = tsfm;
        // clientTransforms.value.set(cId as ConnectionId, tsfm);
      }
    },
  });

  
  async function enterVrSpace() {
    currentVrSpace.value = await connection.client.vr.enterVrSpace.mutate();
  }
  async function leaveVrSpace() {
    await connection.client.vr.leaveVrSpace.mutate();
    currentVrSpace.value = undefined;
  }
  async function updateTransform(transform: ClientTransform){
    await connection.client.vr.transform.updateTransform.mutate(transform);
  }
  
  return {
    currentVrSpace,
    enterVrSpace,
    leaveVrSpace,
    updateTransform,
  };
});