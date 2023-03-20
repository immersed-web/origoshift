import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { defineStore } from 'pinia';
import { reactive, shallowReactive } from 'vue';
import { useConnectionStore } from './connectionStore';

export const useAdminStore = defineStore('admin', () => {
  const connectionStore = useConnectionStore();

  // Refs
  type ReceivedSenderData = SubscriptionValue<RouterOutputs['venue']['subSenderAddedOrRemoved']>['client'];

  // TODO: Do we really want deep reactive object?
  const connectedSenders = reactive<Map<ReceivedSenderData['connectionId'], ReceivedSenderData>>(new Map());

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

  connectionStore.client.soup.subProducerCreated.subscribe(undefined, {
    onData(data) {
      console.log('received new producer:', data);
      const { producingConnectionId, producer } = data;
      const sender = connectedSenders.get(producingConnectionId);
      if(!sender) {
        console.warn('The created producer wasnt in the list of connected senders. Perhaps a normal user?');
        return;
      }
      sender.producers[producer.producerId] = producer;
      connectedSenders.set(producingConnectionId, sender);
    },
  });


  return {
    connectedSenders,

  };
});
