import { Log } from 'debug-level';
const log = new Log('AppRouter');
process.env.DEBUG = 'AppRouter*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { router, procedure, isUserClientM } from '../trpc/trpc';
import { soupRouter } from './soupRouter';
import { vrRouter } from './vrRouter';
import { venueRouter } from './venueRouter';
import { observable, Observer } from '@trpc/server/observable';
import { TypedEmitter } from 'tiny-typed-emitter';
import { z } from 'zod';
import { attachToEvent } from '../trpc/trpc-utils';
import { userRouter } from './userRouter';
import { senderRouter } from './senderRouter';
import { adminRouter } from './adminRouter';
import { cameraRouter } from './cameraRouter';

const appRouterEvents = new TypedEmitter<{
  'heartbeat': (msg: string) => void
}>();
setInterval(() => appRouterEvents.emit('heartbeat', `heartBeat at ${Date.now()}`), 5000);

// const observers: Observer<any, unknown>[] = [];

export const appRouter = router({
  user: userRouter,
  sender: senderRouter,
  admin: adminRouter,
  venue: venueRouter,
  camera: cameraRouter,
  soup: soupRouter,
  vr: vrRouter,
  greeting: procedure.query(({ctx}) => `Hello ${ctx.username}!`),
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
  }),
  subHeartBeat: procedure.subscription(({ctx}) => {
    console.log('heartbeat subscription requested by:', ctx.username);
    // return observable<string>((emit) => {
    //   const handler = (msg: string) => emit.next(msg);
    //   appRouterEvents.addListener('heartbeat', handler);
    //   return () => appRouterEvents.removeListener('heartbeat', handler);
    // });
    return attachToEvent(appRouterEvents, 'heartbeat');
  }),
  // testSubWithInput: procedure.input(z.object({aKey: z.string().uuid(), bKey: z.number()})).subscription(({ctx, input}) => {
  //   const o = observable<{cKey: boolean}>((emit) => {
  //     const intv = setInterval(() => emit.next({cKey: true}));
  //     return () => clearInterval(intv);
  //   });
  //   return o;
  // }),
  // testSubCompletable: procedure.subscription(({ctx}) => {
  //   return observable<'test'>((emit) => {
  //     observers.push(emit);
  //     const intv = setInterval(() => {
  //       console.log('emitting test');
  //       emit.next('test');

  //     }, 1000);
  //     return () => clearInterval(intv);
  //   });
  // }),
  // clearObservers: procedure.mutation(({ctx}) => {
  //   observers.forEach(obs => obs.complete());
  // }),
  // getConnectionId: procedure.query(({ctx}) => {
  //   return ctx.role;
  //   // return `Hello ${ctx.role}!` as const;
  //   // return ctx.client.username;
  // }),
});

export type AppRouter = typeof appRouter;
