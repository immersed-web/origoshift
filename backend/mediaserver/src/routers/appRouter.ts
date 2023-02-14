import { router, procedure } from '../trpc/trpc';
import { soupRouter } from './soupRouter';
import { vrRouter } from './vrRouter';
import { venueRouter } from './venueRouter';
import { observable } from '@trpc/server/observable';
import { TypedEmitter } from 'tiny-typed-emitter';
import { z } from 'zod';
import { attachEmitter } from '../trpc/trpc-utils';

const appRouterEvents = new TypedEmitter<{
  'heartbeat': (msg: string) => void
}>();
setInterval(() => appRouterEvents.emit('heartbeat', `heartBeat at ${Date.now()}`), 5000);

export const appRouter = router({
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
  }),
  heartbeatSub: procedure.subscription(({ctx}) => {
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
  getMe: procedure.query(({ctx}) => {
    return {
      connectionId: ctx.client.connectionId
    };
  }),
  greeting: procedure.query(({ctx}) => `Hello ${ctx.username}!`),
  venue: venueRouter,
  soup: soupRouter,
  vr: vrRouter,
});

export type AppRouter = typeof appRouter;
