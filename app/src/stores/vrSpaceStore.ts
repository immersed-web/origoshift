import { defineStore } from 'pinia';

import type { ClientTransform, ConnectionId } from 'schemas';
import { ref } from 'vue';
import { useConnectionStore } from './connectionStore';
import type { RouterOutputs, SubscriptionValue } from '@/modules/trpcClient';
import { useClientStore } from './clientStore';


export const useVrSpaceStore = defineStore('vrSpace', () => {
  
  const connection = useConnectionStore();
  const clientStore = useClientStore();

  // const clientTransforms = ref<Map<ConnectionId, ClientTransform>>(new Map());
  const currentVrSpace = ref<SubscriptionValue<RouterOutputs['vr']['subVrSpaceStateUpdated']>['data']>();
  
  
  

  connection.client.vr.subVrSpaceStateUpdated.subscribe(undefined, {
    onData(vrSpaceState) {
      console.log(`vrSpaceState updated. ${vrSpaceState.reason}:`, vrSpaceState.data);
      currentVrSpace.value = vrSpaceState.data;
      // updateTransformsFromVrSpaceState();
    },
  });
  
  connection.client.vr.transform.subClientTransforms.subscribe(undefined, {
    onData(value) {
      if(!currentVrSpace.value) return;
      console.log('clientTransforms update received:', value.data);
      for(const [cId, tsfm] of Object.entries(value.data)) {
        const cIdTyped = cId as ConnectionId;
        // if(cId === clientStore.clientState?.connectionId){
        //   continue;
        // }
        if(clientStore.clientState?.connectionId === cId){
          console.log('skipping because is own transform. cId:', cId);
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

  // const clientTransforms = computed(() => {
  //   const filteredTransforms = pickBy(receivedClientTransforms, (ts, cId) => cId !== clientStore.clientState?.connectionId ) ;
    
  //   return filteredTransforms as ClientTransforms;

  //   // const filteredArr = Object.entries(clientStore.clientTransforms).filter(([cId, transform]) => cId !== clientStore.clientState?.connectionId);
  //   // return Object.fromEntries(filteredArr);
  // });
  
  function updateTransformsFromVrSpaceState(){
    console.log('UPDATING transforms from received vrState -------------');
    if(!currentVrSpace.value){
      console.warn('currentVrSpace is undefined. skipping transform update.');
      return;
    }
    // const clientTrsfm = Object.entries(currentVrSpace.value.clients).reduce((acc, [cId, client]) => {
    //   const trsfm = client.transform;
    //   if(!trsfm) return acc;
    //   acc[cId as ConnectionId] = trsfm;
    //   return acc;
    // }, {} as ClientTransforms);
    // receivedClientTransforms = clientTrsfm;
    
    // console.log('clientTransform before update:', toRaw(clientTransforms.value));
    
    for(const [cId, {transform}] of Object.entries(currentVrSpace.value.clients)){
      if(!transform){
        console.log('skipping because client has no transform');
        continue;
      }
      
      if(clientStore.clientState?.connectionId === cId){
        console.log('skipping because is own transform. cId:', cId);
        continue;
      }
      console.log(`setting transform for ${cId} to:`, transform);
      // clientTransforms.value.set(cId as ConnectionId, transform);
    }
    // for(const cId of clientTransforms.value.keys()){
    //   if(cId in currentVrSpace.value.clients) continue;
    //   console.log(`removing client (${cId}) that is no longer in the vrSpace from clientTransforms`);
    //   clientTransforms.value.delete(cId);
    // }
    // console.log('clientTransform after update:', toRaw(clientTransforms.value));
  }
  
  async function enterVrSpace() {
    currentVrSpace.value = await connection.client.vr.enterVrSpace.mutate();
    // updateTransformsFromVrSpaceState();
  }
  async function leaveVrSpace() {
    await connection.client.vr.leaveVrSpace.mutate();
  }
  async function updateTransform(transform: ClientTransform){
    await connection.client.vr.transform.updateTransform.mutate(transform);
  }
  
  return {
    currentVrSpace,
    // clientTransforms,
    enterVrSpace,
    leaveVrSpace,
    updateTransform,
  };
});