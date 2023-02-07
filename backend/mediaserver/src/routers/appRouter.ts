import { router, procedure } from '../trpc/trpc';
import { soupRouter } from './soupRouter';


export const appRouter = router({
  health: procedure.query(({ctx}) => {
    return 'Yooo! I\'m healthy' as const;
  }),
  greeting: procedure.query(({ctx}) => `Hello ${ctx.username}!`),
  soup: soupRouter
});

export type AppRouter = typeof appRouter;
