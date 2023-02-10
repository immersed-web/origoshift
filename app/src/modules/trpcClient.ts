import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type {} from '@trpc/server';
import type { AppRouter } from 'mediaserver';
import { guestWithAutoToken, loginWithAutoToken, getToken } from '@/modules/authClient';


let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
let wsClient: ReturnType<typeof createWSClient> | undefined;
let currentClientIsGuest = true;
const createAutoClient = async (autoLogin: () => Promise<string>) => {
  await autoLogin();

  const createTearableClient = () => {
    wsClient?.close();
    const token = getToken();
    wsClient = createWSClient({
      url: `ws://localhost:9001?${token}`,
      onClose: (cause) => {
        console.log('wsClient ONCLOSE triggered. cause: ', cause);
        // if(cause?.code){
        //   console.log('THERE was a CLOSE REASON CODE. Will tear down and up again');
        //   createTearableClient();
        // }

      },
    });
    const onError = (ev: Event) => {
      wsClient?.getConnection().removeEventListener('close', onClose);
      // Note: This is a hack to be able to retry with a NEW Token, since TRPC defaults to retry with same url... Sigh...
      console.log('native websocket error ATTACHED THORUGH wsClient:', ev);
      createTearableClient();
    };
    wsClient.getConnection().addEventListener('error', onError);
    const onClose =  (ev: CloseEvent) => {
      console.log('native websocket close ATTACHED THROUGH wsClient: ', ev);
      if(ev.code){
        wsClient?.getConnection().removeEventListener('error', onError);
        createTearableClient();
      }
    };
    wsClient.getConnection().addEventListener('close', onClose);
  };

  createTearableClient();
  // wsClient = createWSClient({url: `ws://localhost:9001?${token}`, onClose(cause) {
  //     console.error(`Socket closed!! ${cause?.code}`);
  //   },
  // });
  // client = createTRPCProxyClient<AppRouter>({
  //   links: [
  //     wsLink({client: wsClient}),
  //   ],
  // });
  // console.log(await client.health.query());

  // return client;
};

export const getLoggedInClient = async (username: string, password: string) => {
  if(!currentClientIsGuest && client){
    return client;
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    // wsClient.getConnection().close();
  }
  console.log('creating logged in client');
  await createAutoClient(() => loginWithAutoToken(username, password));
  currentClientIsGuest = false;
  return client;
};

export const getGuestClient = async () => {
  if(currentClientIsGuest && client){
    return client;
  }
  if(wsClient){
    console.log('closing previous wsLink!');
    wsClient.close();
    // wsClient.getConnection().close();
  }
  console.log('creating guest client');
  await createAutoClient(() => guestWithAutoToken());
  currentClientIsGuest = true;
  return client;
};
