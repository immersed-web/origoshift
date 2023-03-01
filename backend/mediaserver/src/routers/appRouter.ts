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
import { attachEmitter } from '../trpc/trpc-utils';

const appRouterEvents = new TypedEmitter<{
  'heartbeat': (msg: string) => void
}>();
setInterval(() => appRouterEvents.emit('heartbeat', `heartBeat at ${Date.now()}`), 5000);

const observers: Observer<any, unknown>[] = [];

export const appRouter = router({
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
    return attachEmitter(appRouterEvents, 'heartbeat');
  }),
  testSubWithInput: procedure.input(z.object({aKey: z.string().uuid(), bKey: z.number()})).subscription(({ctx, input}) => {
    const o = observable<{cKey: boolean}>((emit) => {
      const intv = setInterval(() => emit.next({cKey: true}));
      return () => clearInterval(intv);
    });
    return o;
  }),
  testSubCompletable: procedure.subscription(({ctx}) => {
    return observable<'test'>((emit) => {
      observers.push(emit);
      const intv = setInterval(() => {
        console.log('emitting test');
        emit.next('test');

      }, 1000);
      return () => clearInterval(intv);
    });
  }),
  clearObservers: procedure.mutation(({ctx}) => {
    observers.forEach(obs => obs.complete());
  }),
  getClientState: procedure.use(isUserClientM).query(({ctx}) => {
    return ctx.client.getPublicState();
    // return state.role;
    // return ctx.client.connectionId;
    // return 'Test' as const;
  }),
  subClientState: procedure.use(isUserClientM).subscription(({ctx}) => {
    return attachEmitter(ctx.client.userEvents, 'clientState');
  }),
  getConnectionId: procedure.query(({ctx}) => {
    return ctx.role;
    // return `Hello ${ctx.role}!` as const;
    // return ctx.client.username;
  }),
  greeting: procedure.query(({ctx}) => `Hello ${ctx.username}!`),
  venue: venueRouter,
  soup: soupRouter,
  vr: vrRouter,
});

export type AppRouter = typeof appRouter;
