import { router, procedure } from '../trpc/trpc';
import { soupRouter } from './soupRouter';
import { vrRouter } from './vrRouter';
import { venueRouter } from './venueRouter';

export const appRouter = router({
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
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
