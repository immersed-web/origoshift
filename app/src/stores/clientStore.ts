// import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
// import type { ClientTransform, ConnectionId } from 'schemas';
import { clientOrThrow } from '@/modules/trpcClient';
import type { ClientTransforms } from 'schemas';
import { useConnectionStore } from './connectionStore';
import { ref } from 'vue';

export const useClientStore = defineStore('client', () => {

  const connection = useConnectionStore();


  const clientState = ref<RouterOutputs['user']['getClientState']>();
  const clientTransforms = ref<ClientTransforms>();

  // const loggedIn = () => {
  //   return !!clientState.value?.userId;
  // };

  const initials = () => {
    return clientState.value?.username ? clientState.value?.username.split(' ').map(n => n[0]).join('') : '';
  };

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
