import { clientOrThrow, trpcClient, createTrpcClient, wsClient, closeClient } from '@/modules/trpcClient';
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

  // TODO: We cant have this getter throwing. As soon vue devtools loads we get a bunch of Errors.
  // Basically, we cant have the implicit requirement to call init before trying to use the client.
  const client: ShallowRef<CreateTRPCProxyClient<AppRouter>> = shallowRef(clientOrThrow);
  const clientExists = computed(() => {
    return !!trpcClient.value;
  });

  let connectionStatusChecker: ReturnType<typeof setInterval> | undefined;

  async function close() {
    closeClient();
  }

  async function _initConnection () {
    if(connectionStatusChecker){
      clearInterval(connectionStatusChecker);
    }
    // client.value.subHeartBeat.subscribe(undefined, {onData(data){connected.value = true;}, onStopped(){ connected.value = false;}, onComplete(){connected.value = false;}});
    const wsC = wsClient();
    if(!wsC){
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
    let ws = wsC.getConnection();
    attachWsEvents(ws);
    // NOTE: This was the only way I managed to reliably retrieve the (new) socket instance after connection is closed.
    connectionStatusChecker = setInterval(() => {
      if(ws.readyState === ws.CLOSED){
        const wsC = wsClient();
        if(!wsC){
          console.error('wsClient undefined when trying to retrieve websocket connection');
          return;
        }
        ws = wsC.getConnection();
        attachWsEvents(ws);
      }
    }, 1000);

    // const greetingResponse = await client.value.greeting.query();
    // console.log('greeting response: ', greetingResponse);
  }

  function createSenderClient(){
    if(!authStore.isAuthenticated){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    createTrpcClient(() => authStore.tokenOrThrow(), 'sender');
    connectionType.value = 'sender';
    _initConnection();
  }

  function createUserClient() {
    if(!authStore.isAuthenticated){
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
    close,
  };
});
