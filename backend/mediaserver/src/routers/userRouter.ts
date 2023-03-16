import { attachEmitter } from '../trpc/trpc-utils';
// import { UserClient } from '../classes/InternalClasses';
import { isUserClientM, procedure as p, router } from '../trpc/trpc';

const userClientP = p.use(isUserClientM);

export const userRouter = router({
  getClientState: userClientP.query(({ctx}) => {
    return ctx.client.getPublicState();
    // return state.role;
    // return ctx.client.connectionId;
    // return 'Test' as const;
  }),
  subClientState: userClientP.subscription(({ctx}) => {
    return attachEmitter(ctx.client.base.event, 'clientState');
  }),
});
