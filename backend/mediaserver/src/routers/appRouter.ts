import { router, procedure } from '../trpc/trpc';
import { soupRouter } from './soupRouter';
import { vrRouter } from './vrRouter';
import { venueRouter } from './venueRouter';
import { observable } from '@trpc/server/observable';

let tickTock: 'tick' | 'tock' = 'tick';
export const appRouter = router({
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
  }),
  heartbeatSub: procedure.subscription(({ctx}) => {
    console.log('heartbeat subscription requested by:', ctx.username);
    return observable<'tick'|'tock'>((emit) => {
      const interval = setInterval(() => {
        emit.next(tickTock);
        tickTock = tickTock === 'tick' ? 'tock' : 'tick';
      }, 1500);

      return () => clearInterval(interval);
    });
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
