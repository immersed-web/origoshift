import { clientOrThrow, createTrpcClient, wsClient } from '@/modules/trpcClient';
import type { CreateTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from 'mediaserver';
import { defineStore } from 'pinia';
import type { ClientType } from 'schemas';
import { ref, shallowRef, type ShallowRef } from 'vue';
import { useAuthStore } from './authStore';


// TODO: I would actually prefer to export the client from here aswell to make the surface area easier for the programmer.
// Then they would always interact with the store instead of directly with the client.
// But we end up witht the dreaded typescript unamed export issue:
// https://github.com/microsoft/TypeScript/issues/9944
// The normal workaround is explicit typing of exports, but I dont know a clean way to explicitly type
// the store without adding a lot of boilerplate which would make it very cumbersome to refactor...

// const client: ShallowRef<CreateTRPCProxyClient<AppRouter> | undefined> = ref();
export const useConnectionStore = defineStore('connection', () => {
  const authStore = useAuthStore();
  const connected = ref(false);
  const connectionType = ref<ClientType>();

  // createTrpcClient(() => authStore.tokenOrThrow, 'user');
  // Not possible at the moment because of unnamed exported types
  const client: ShallowRef<CreateTRPCProxyClient<AppRouter>> = shallowRef(clientOrThrow);

  // _initConnection();
  async function _initConnection () {
    // client.value.subHeartBeat.subscribe(undefined, {onData(data){connected.value = true;}, onStopped(){ connected.value = false;}, onComplete(){connected.value = false;}});
    if(!wsClient){
      throw Error('must create a trpc client (and thus implicitly a wsClient) before accessing the ws connection');
    }
    const ws = wsClient.getConnection();
    ws.addEventListener('open', () => connected.value = true);
    ws.addEventListener('close', () => connected.value = false);

    const greetingResponse = await client.value.greeting.query();
    console.log('greeting response: ', greetingResponse);
  }

  function createSenderClient(){
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    createTrpcClient(() => authStore.tokenOrThrow, 'sender');
    connectionType.value = 'sender';
    _initConnection();
  }

  function createUserClient() {
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    createTrpcClient(() => authStore.tokenOrThrow, 'client');
    connectionType.value = 'client';
    _initConnection();
  }

  return {
    client,
    connected,
    connectionType,
    createSenderClient,
    createUserClient,
  };
});
