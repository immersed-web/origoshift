import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type {} from '@trpc/server';
import type { AppRouter } from 'mediaserver';
import { autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';

const init = async () => {
  await autoGuestToken();
  const wsClient = createWSClient({url: `ws://localhost:9001?${latestGuestJwtToken}`});
  const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client: wsClient}),
    ],
  });
  return trpcClient;
};

export const getClient = init();
