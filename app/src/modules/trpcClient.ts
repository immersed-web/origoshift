import { createTRPCProxyClient, TRPCClientError, wsLink, type CreateTRPCProxyClient } from '@trpc/client';
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type { inferObservableValue } from '@trpc/server/observable';
import { createWSClient } from './customWsLink';
import type { AppRouter } from 'mediaserver';
import type { ClientType } from 'schemas';
import superjson from 'superjson';
// import { guestAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';

import { shallowRef, type ShallowRef, computed, type ComputedRef } from 'vue';
import { devtoolsLink } from 'trpc-client-devtools-link';


const wsBaseURL = 'ws://localhost:9001';

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}


const trpcClient: ShallowRef<CreateTRPCProxyClient<AppRouter> | undefined> = shallowRef();
export const clientOrThrow: ComputedRef<CreateTRPCProxyClient<AppRouter>> = computed(() => {
  if(!trpcClient.value){
    throw Error('tried to access non-existent trpc-client. Very sad!!');
  }
  return trpcClient.value;
});

export let wsClient: ReturnType<typeof createWSClient> | undefined;

let currentClientType: ClientType | undefined;

function buildConnectionUrl(token:string, connectAsSender?: boolean){
  if(connectAsSender){
    return `${wsBaseURL}?token=${token}&sender`;
  }
  return `${wsBaseURL}?token=${token}`;
}

export type RouterOutputs = inferRouterOutputs<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>
export type SubscriptionValue<Subscription> = inferObservableValue<Subscription>;

export const createTrpcClient = (getToken: () => string, clientType: ClientType = 'client' ) => {
  if(trpcClient.value && currentClientType === clientType){
    console.warn(`Eeeeeh. You are creating a new (${clientType}) trpc-client when there is already one running. Are you suuure you know what you are doing?? I am rather sure you dont wanna do this :-P`);
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    wsClient.getConnection().close();
  }
  console.log('creating trpc client');
  // await loginWithAutoToken(username, password);
  wsClient = createWSClient({
    url: () => buildConnectionUrl(getToken(), clientType === 'sender'),
  });
  trpcClient.value = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    // transformer: {
    //   serialize: pack,
    //   deserialize: unpack,
    // },
    links: [
      devtoolsLink(),
      wsLink({client: wsClient}),
    ],
  });

  (async () => {
    console.log('###### testing endpoint of new client');
    console.log('client is: ', trpcClient.value);
    try {
      const response = await trpcClient.value?.greeting.query();
      console.log('response:', response);
    } catch(e) {
      console.error(e);
    }
  })();
  currentClientType = clientType;
  // return trpcClient.value;
};
