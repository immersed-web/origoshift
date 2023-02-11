import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type {} from '@trpc/server';
import type { AppRouter } from 'mediaserver';
import { guestWithAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';

// import { ref } from 'vue';


let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const client = ref<ReturnType<typeof createTRPCProxyClient<AppRouter>>>();

let wsClient: ReturnType<typeof createWSClient> | undefined;
let currentClientIsGuest = true;
if(import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', (payload) => {
    console.log('Removing dangling interval before hot reload!');
    clearInterval(connectionTimer);
  });
}

let connectionTimer: ReturnType<typeof setInterval>;
const createAutoClient = async (autoLogin: () => Promise<string>) => {
  if(connectionTimer){
    clearInterval(connectionTimer);
  }
  const token = await autoLogin();

  const createApi = (token: string) => {
    wsClient = createWSClient({url: `ws://localhost:9001?${token}`, onClose(cause) {
      console.error(`Socket closed. Reason: ${cause?.code}`);
    }});
    client = createTRPCProxyClient<AppRouter>({
      links: [
        wsLink({client: wsClient}),
      ],
    });
  };

  createApi(token);

  console.log(await client.health.query());

  connectionTimer = setInterval(() => {
    // console.log('TIMER TRIGGERED ----------------');
    // console.timeEnd('connectionTimer');
    // console.time('connectionTimer');
    const readyState = wsClient?.getConnection().readyState;
    // console.log('connection readyState: ', readyState);
    if(readyState !== WebSocket.OPEN){
      // console.log('CREATING NEW WsClient!!!!');
      wsClient?.close();
      wsClient?.getConnection().close();
      wsClient = undefined;

      const token = getToken();
      createApi(token);
    }
  }, 5000);

  return client;
};
export const getClient = () => client;

export const startLoggedInClient = async (username: string, password: string) => {
  if(!currentClientIsGuest && client){
    return client;
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating logged in client');
  await createAutoClient(() => loginWithAutoToken(username, password));
  currentClientIsGuest = false;
  return client;
};

export const startGuestClient = async () => {
  if(currentClientIsGuest && client){
    return client;
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating guest client');
  await createAutoClient(() => guestWithAutoToken());
  currentClientIsGuest = true;
  return client;
};
