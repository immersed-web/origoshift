import { createTRPCProxyClient, wsLink } from '@trpc/client';
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import { createWSClient } from './customWsLink';
import type { AppRouter } from 'mediaserver';
import { guestWithAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';
import type {} from 'zod';

import { shallowRef, type ShallowRef } from 'vue';


const wsBaseURL = 'ws://localhost:9001';


let wsClient: ReturnType<typeof createWSClient> | undefined;
let currentClientIsGuest = true;


export type RouterOutputs = inferRouterOutputs<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>

type ClientGetter = () => ReturnType<typeof createTRPCProxyClient<AppRouter>>;
export const getClient: ClientGetter = () => client.value;

export const startLoggedInClient = async (username: string, password: string) => {
  if(client.value && !currentClientIsGuest){
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
  client.value = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  currentClientIsGuest = false;


  // return client;
};

const createGuestClient = () => {
  console.log('creating guest client');
  guestWithAutoToken();
  wsClient = createWSClient({
    url: () => `${wsBaseURL}?${getToken()}`,
  });
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });

  return client;
};

export const startGuestClient = () => {
  console.log('starting guest client');
  if(client.value && currentClientIsGuest){
    console.warn('Eeeeeh. You are creating a new trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P');
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  client.value = createGuestClient();
  currentClientIsGuest = true;

};

// const subscribeToEndpoint = <P extends {
//   'subscribe': (input: any, opts: {'onData': (data: any) => void}) => Unsubscribable
// }>(endPoint: P, input: Parameters<P['subscribe']>[0], onData: Parameters<P['subscribe']>[1]['onData']) => {
//   // Implement here
// }

const firstClient = createGuestClient();
export const client: ShallowRef<ReturnType<typeof createTRPCProxyClient<AppRouter>>> = shallowRef<ReturnType<typeof createTRPCProxyClient<AppRouter>>>(firstClient);
