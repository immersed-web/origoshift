import { createTRPCProxyClient, wsLink } from '@trpc/client';
import { createWSClient } from './customWsLink';
import type { AppRouter } from 'mediaserver';
import { guestWithAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';

// import { ref } from 'vue';


const wsBaseURL = 'ws://localhost:9001';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

let wsClient: ReturnType<typeof createWSClient> | undefined;
let currentClientIsGuest = true;

// if(import.meta.hot) {
//   import.meta.hot.on('vite:beforeUpdate', (payload) => {
//     console.log('Removing dangling interval before hot reload!');
//     clearInterval(connectionTimer);
//   });
// }

// let connectionTimer: ReturnType<typeof setInterval>;
// const createAutoClient = async (autoLogin: () => Promise<string>) => {
//   if(connectionTimer){
//     clearInterval(connectionTimer);
//   }
//   const token = await autoLogin();

//   const createApi = (token: string) => {
//     wsClient = createWSClient({url: `ws://localhost:9001?${token}`, onClose(cause) {
//       console.error(`Socket closed. Reason: ${cause?.code}`);
//     }});
//     client = createTRPCProxyClient<AppRouter>({
//       links: [
//         wsLink({client: wsClient}),
//       ],
//     });
//   };

//   createApi(token);

//   console.log(await client.health.query());

//   connectionTimer = setInterval(() => {
//     // console.log('TIMER TRIGGERED ----------------');
//     // console.timeEnd('connectionTimer');
//     // console.time('connectionTimer');
//     const readyState = wsClient?.getConnection().readyState;
//     // console.log('connection readyState: ', readyState);
//     if(readyState !== WebSocket.OPEN){
//       // console.log('CREATING NEW WsClient!!!!');
//       wsClient?.close();
//       wsClient?.getConnection().close();
//       wsClient = undefined;

//       const token = getToken();
//       createApi(token);
//     }
//   }, 5000);

//   return client;
// };

export const getClient = () => client;

export const startLoggedInClient = async (username: string, password: string) => {
  if(client && !currentClientIsGuest){
    console.warn('Eeeeeh. You are creating a new trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating logged in client');
  await loginWithAutoToken(username, password);
  wsClient = createWSClient({
    url: () => `${wsBaseURL}?${getToken()}`,
  });
  client = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  currentClientIsGuest = false;


  // await createAutoClient(() => loginWithAutoToken(username, password));
  // return client;
};

export const startGuestClient = async () => {
  if(client && currentClientIsGuest){
    console.warn('Eeeeeh. You are creating a new trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating guest client');
  await guestWithAutoToken();
  wsClient = createWSClient({
    url: () => `${wsBaseURL}?${getToken()}`,
  });
  client = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  currentClientIsGuest = true;

  // await createAutoClient(() => guestWithAutoToken());
  // return client;
};

// const subscribeToEndpoint = <P extends {
//   'subscribe': (input: any, opts: {'onData': (data: any) => void}) => Unsubscribable
// }>(endPoint: P, input: Parameters<P['subscribe']>[0], onData: Parameters<P['subscribe']>[1]['onData']) => {
//   // Implement here
// }
