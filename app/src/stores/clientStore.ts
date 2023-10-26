// import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import type { ClientTransforms } from 'schemas';
import { useConnectionStore } from './connectionStore';
import { ref, computed } from 'vue';

export const useClientStore = defineStore('client', () => {

  const connection = useConnectionStore();

  if(!connection.clientExists){
    throw Error('This store (clientStore) relies on there being a client created. Make sure to create a connection using the connection store before using this store');
  }

  // TODO: We have a minor trouble here were we will receive either senderclient state or userclient state but treat it as userclient state regardless
  // Its minor because the idea is to only interact with this store if userClient (not if senderCLient).
  // But we should probably make sure the clientState isnt assigned if the user is a senderClient, to help future selfs avoid pain.
  const clientState = ref<RouterOutputs['user']['getClientState']>();
  const clientTransforms = ref<ClientTransforms>();

  const initials = computed(() => {
    return clientState.value?.username ? clientState.value?.username.split(' ').map(n => n[0]).join('') : '';
  });

  const fetchClientState = async () => {
    const receivedState = await connection.client.user.getClientState.query();
    console.log('manually fetched new clientstate:', receivedState);
    clientState.value = receivedState;
  };

  const initConnection = async () => {
    clientState.value = await connection.client.user.getClientState.query();
    // await this.updateClientState();
    connection.client.user.subOwnClientState.subscribe(undefined, {
      onData: (data) => {
        console.log(`clientState received. Reason: ${data.reason}`);
        clientState.value = data.myState;
      },
    });
  };

  // Init
  initConnection();

  return {
    clientState,
    clientTransforms,
    initials,
    fetchClientState,
  };

});
