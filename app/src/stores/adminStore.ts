import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { defineStore } from 'pinia';
import { reactive, shallowReactive } from 'vue';
import { useConnectionStore } from './connectionStore';
import { useVenueStore } from './venueStore';

export const useAdminStore = defineStore('admin', () => {
  const connectionStore = useConnectionStore();
  const venueStore = useVenueStore();

  // Refs
  type ReceivedSenderData = SubscriptionValue<RouterOutputs['admin']['subSenderAddedOrRemoved']>['client'];

  // TODO: Do we really want deep reactive object?
  const connectedSenders = reactive<Map<ReceivedSenderData['connectionId'], ReceivedSenderData>>(new Map());

  connectionStore.client.admin.subSenderAddedOrRemoved.subscribe(undefined, {
    onData({data, reason}) {
      console.log('senderAddedOrRemoved triggered!:', data, reason);
      const client = data.senderState;
      if(data.added){
        connectedSenders.set(client.connectionId ,client);
      } else {
        connectedSenders.delete(client.connectionId);
      }
    },
  });

  connectionStore.client.admin.subProducerCreated.subscribe(undefined, {
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

  connectionStore.client.admin.subVenueStateUpdated.subscribe(undefined, {
    onData(data){
      console.log('received venuestate updated:', data);
      venueStore.currentVenue = data;
    },
  });


  return {
    connectedSenders,

  };
});
