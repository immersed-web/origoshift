
import { SenderClient } from '../classes/InternalClasses';
import { procedure as p, router } from '../trpc/trpc';

export const userRouter = router({
  createUserClient: p.mutation(({ctx}) => {
    ctx.connection.client = new SenderClient({connectionId: ctx.connectionId, jwtUserData: ctx.connection.jwtUserData});
  })
});
