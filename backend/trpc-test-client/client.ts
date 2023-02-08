import {
  createTRPCProxyClient,
  createWSClient,
  wsLink,
} from '@trpc/client';
// import { Unsubscribable } from '@trpc/server/observable';
import ws from 'ws';
import type { AppRouter } from 'mediaserver';

// polyfill fetch & websocket
const globalAny = global as any;
globalAny.WebSocket = ws;


const randomInt = Math.trunc(Math.random()*1000)
const wsClient = createWSClient({
  url: `ws://localhost:9001?user-${randomInt}`,
});

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
        client: wsClient,
      })
  ],
});



async function main() {
  const resp = await trpc.vr.getClientTransforms.query();
  // Object.entries(resp).map(([key, clientpos]) => {
  //   clientpos.
  // })

  const subscription = trpc.testSub.subscribe(undefined, {
    onData(value) {

    },
  })
  wsClient.close();
}

main();
