import {
  createTRPCProxyClient,
  createWSClient,
  wsLink,
} from '@trpc/client';
import type { Unsubscribable } from '@trpc/server/observable';
import type { AppRouter } from './server';


const randomInt = Math.trunc(Math.random()*1000);
const wsClient = createWSClient({
  url: `ws://localhost:2022?user-${randomInt}`,
});

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});



async function main() {
  const myToken = await trpc.room.getMyToken.query();
  const response = await trpc.room.updateMyPosition.mutate({x: 1, y: 2, z: 3});
  console.log('MY TOKEN IS:', myToken);

  const subShouldNotTrigger = await new Promise<Unsubscribable>(resolve => {
    const sub = trpc.room.onRoomUpdate.subscribe({excludeSelf: true}, {
      onData: (data) => console.log('received subscribed roomState:', data),
      onStarted() {
        resolve(sub);
      },
    });
  });

  const createdRoom = await trpc.room.createAndJoinRoom.mutate('coolRoom');
  console.log('created room: ', createdRoom);

  // subShouldNotTrigger.unsubscribe();

  await trpc.room.updateMyPosition.mutate({
    x: 1,
    y: 2,
    z: 3,
  });

  const subShouldTrigger = await new Promise<Unsubscribable>(resolve => {
    const sub = trpc.room.onRoomUpdate.subscribe({excludeSelf: false}, {
      onData: (data) => console.log('received subscribed roomState:', data),
      onStarted() {
        resolve(sub);
      },
    });
  });

  const createdRoom2 = await trpc.room.createAndJoinRoom.mutate('boringRoom');
  console.log('created room 2:', createdRoom2);


  subShouldTrigger.unsubscribe();

  wsClient.close();
}

main();
