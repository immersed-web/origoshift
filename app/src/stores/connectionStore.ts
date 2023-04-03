import { clientOrThrow, trpcClient, createTrpcClient, wsClient } from '@/modules/trpcClient';
import type { CreateTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from 'mediaserver';
import { defineStore } from 'pinia';
import type { ClientType } from 'schemas';
import { computed, ref, shallowRef, type ShallowRef } from 'vue';
import { useAuthStore } from './authStore';

export const useConnectionStore = defineStore('connection', () => {
  console.log('connection store initializing!!');
  const authStore = useAuthStore();
  const connected = ref(false);
  const connectionType = ref<ClientType>();

  // let _resolve: () => void;
  // // let _reject: (reason?: any) => void;
  // const firstConnectionEstablished = new Promise<void>((resolve, reject)=>{
  //   _resolve = resolve;
  //   // _reject = reject;
  // });

  // createTrpcClient(() => authStore.tokenOrThrow, 'user');
  // Not possible at the moment because of unnamed exported types
  const client: ShallowRef<CreateTRPCProxyClient<AppRouter>> = shallowRef(clientOrThrow);
  const clientExists = computed(() => {
    return !!trpcClient.value;
  });

  async function _initConnection () {
    // client.value.subHeartBeat.subscribe(undefined, {onData(data){connected.value = true;}, onStopped(){ connected.value = false;}, onComplete(){connected.value = false;}});
    if(!wsClient){
      throw Error('must create a trpc client (and thus implicitly a wsClient) before accessing the ws connection');
    }
    // reactiveWSConnection.value = wsClient.getConnection();
    function attachWsEvents(ws:WebSocket){
      if(ws.readyState === ws.OPEN){
        connected.value = true;
      }
      ws.addEventListener('close', () => {
        connected.value = false;
        // const ws = wsClient.getConnection();
        // attachWsEvents(ws, wsClient);
      });
      ws.addEventListener('open', () => {
        connected.value = true;
      });
      ws.addEventListener('error', () => {
        connected.value = false;
        // const ws = wsClient.getConnection();
        // attachWsEvents(ws, wsClient);
      });
    }
    let ws = wsClient.getConnection();
    attachWsEvents(ws);
    // NOTE: This was the only way I managed to reliably retrieve the (new) socket instance after connection is closed.
    setInterval(() => {
      if(ws.readyState === ws.CLOSED){
        if(!wsClient){
          console.error('wsClient undefined when trying to retrieve websocket connection');
          return;
        }
        ws = wsClient?.getConnection();
        attachWsEvents(ws);
      }
    }, 1000);

    // const greetingResponse = await client.value.greeting.query();
    // console.log('greeting response: ', greetingResponse);
  }

  function createSenderClient(){
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    createTrpcClient(() => authStore.tokenOrThrow(), 'sender');
    connectionType.value = 'sender';
    _initConnection();
  }

  function createUserClient() {
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    createTrpcClient(() => authStore.tokenOrThrow(), 'client');
    connectionType.value = 'client';
    _initConnection();
  }

  return {
    client,
    clientExists,
    connected,
    connectionType,
    createSenderClient,
    createUserClient,
  };
});
