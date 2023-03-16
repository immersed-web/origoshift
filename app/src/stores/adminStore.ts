import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { defineStore } from 'pinia';
import { shallowReactive } from 'vue';
import { useConnectionStore } from './connectionStore';

export const useAdminStore = defineStore('admin', () => {
  const connectionStore = useConnectionStore();

  // Refs
  type ReceivedSenderData = SubscriptionValue<RouterOutputs['venue']['subSenderAddedOrRemoved']>['client'];
  const connectedSenders = shallowReactive<Map<ReceivedSenderData['connectionId'], ReceivedSenderData>>(new Map());
  connectionStore.client.venue.subSenderAddedOrRemoved.subscribe(undefined, {
    onData(data) {
      const client = data.client;
      if(data.added){
        connectedSenders.set(client.connectionId ,client);
      } else {
        connectedSenders.delete(client.connectionId);
      }
    },
  });

  connectionStore.client.venue.subClientStateUpdated.subscribe(undefined, {
    onData(data) {
      console.log('received clientStateUpdated:', data);
      const clientState = data.clientState;
      if(clientState.clientType !== 'sender') {
        return;
      }
      connectedSenders.set(clientState.connectionId ,clientState);
    },
  });


  return {
    connectedSenders,

  };
});
