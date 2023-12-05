import { defineStore } from 'pinia';

import type { ClientTransform, ConnectionId } from 'schemas';
import { ref, watch } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';
import { useClientStore } from './clientStore';

export const useVrSpaceStore = defineStore('vrSpace', () => {
  
  const connection = useConnectionStore();
  const clientStore = useClientStore();

  const currentVrSpace = ref<SubscriptionValue<RouterOutputs['vr']['subVrSpaceStateUpdated']>['data']>();


  // watch(() => currentVrSpace.value?.clients, (n, o) => console.log('clients in store watched. new:', n, ' old:', o));
  connection.client.vr.subVrSpaceStateUpdated.subscribe(undefined, {
    onData(vrSpaceState) {
      console.log(`vrSpaceState updated. ${vrSpaceState.reason}:`, vrSpaceState.data);
      currentVrSpace.value = vrSpaceState.data;
    },
  });
  
  connection.client.vr.transform.subClientTransforms.subscribe(undefined, {
    onData(subscribeValue) {
      if(!currentVrSpace.value) return;
      // console.log('clientTransforms update received:', subscribeValue.data);
      for(const [cId, tsfm] of Object.entries(subscribeValue.data)) {
        const cIdTyped = cId as ConnectionId;
        // if(cId === clientStore.clientState?.connectionId){
        //   continue;
        // }
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
    await connection.client.vr.enterVrSpace.mutate();
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