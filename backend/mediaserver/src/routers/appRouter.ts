import { router, procedure } from '../trpc/trpc';
import { soupRouter } from './soupRouter';
import { vrRouter } from './vrRouter';

export const appRouter = router({
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
  }),
  greeting: procedure.query(({ctx}) => `Hello ${ctx.username}!`),
  soup: soupRouter,
  vr: vrRouter,
});

export type AppRouter = typeof appRouter;
