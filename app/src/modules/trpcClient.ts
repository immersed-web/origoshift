import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type {} from '@trpc/server';
import type { AppRouter } from 'mediaserver';
import { autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';


let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
export const getClient = async () => {
  if(client){
    return client;
  }
  await autoGuestToken();

  const wsClient = createWSClient({url: `ws://localhost:9001?${latestGuestJwtToken}`});
  client = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  console.log(await client.health.query());

  return client;
};
