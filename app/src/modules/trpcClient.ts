import { createTRPCProxyClient, TRPCClientError, wsLink} from '@trpc/client';
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import { createWSClient } from './customWsLink';
import type { AppRouter } from 'mediaserver';
import { guestAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';
import type {} from 'zod';

import { shallowRef, type ShallowRef } from 'vue';


const wsBaseURL = 'ws://localhost:9001';

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}


let wsClient: ReturnType<typeof createWSClient> | undefined;
let currentClientType: 'guest' | 'user' | 'sender' | undefined;

function buildConnectionUrl(token:string, connectAsSender?: boolean){
  if(connectAsSender){
    return `${wsBaseURL}?token=${token}&sender`;
  }
  return `${wsBaseURL}?token=${token}`;
}


export type RouterOutputs = inferRouterOutputs<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>

type ClientGetter = () => ReturnType<typeof createTRPCProxyClient<AppRouter>>;
export const getClient: ClientGetter = () => client.value;

export const startSenderClient = async (username: string, password: string) => {
  if(client.value && currentClientType === 'sender'){
    console.warn('Eeeeeh. You are creating a new (sender) trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating logged in client');
  await loginWithAutoToken(username, password);
  wsClient = createWSClient({
    url: () => buildConnectionUrl(getToken(), true),
  });
  client.value = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  currentClientType = 'sender';
};

export const startLoggedInClient = async (username: string, password: string) => {
  if(client.value && currentClientType === 'user'){
    console.warn('Eeeeeh. You are creating a new (logged in) trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating logged in client');
  await loginWithAutoToken(username, password);
  wsClient = createWSClient({
    url: () => buildConnectionUrl(getToken()),
  });
  client.value = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  currentClientType = 'user';
};

const createGuestClient = () => {
  console.log('creating guest client');
  guestAutoToken();
  wsClient = createWSClient({
    url: () => buildConnectionUrl(getToken()),
  });
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });

  currentClientType = 'guest';
  return client;
};

export const startGuestClient = () => {
  console.log('starting guest client');
  if(client.value && currentClientType === 'guest'){
    console.warn('Eeeeeh. You are creating a new  (guest) trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  client.value = createGuestClient();
};

// const subscribeToEndpoint = <P extends {
//   'subscribe': (input: any, opts: {'onData': (data: any) => void}) => Unsubscribable
// }>(endPoint: P, input: Parameters<P['subscribe']>[0], onData: Parameters<P['subscribe']>[1]['onData']) => {
//   // Implement here
// }

const firstClient = createGuestClient();
export const client: ShallowRef<ReturnType<typeof createTRPCProxyClient<AppRouter>>> = shallowRef<ReturnType<typeof createTRPCProxyClient<AppRouter>>>(firstClient);

// const test = async () => {
//   const response = await client.value.getClientState.query();
// };
