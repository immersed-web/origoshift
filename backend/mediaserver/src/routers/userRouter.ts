import { attachToEvent, attachToFilteredEvent } from '../trpc/trpc-utils';
// import { UserClient } from '../classes/InternalClasses';
import { isUserClientM, userClientP, procedure as p, router } from '../trpc/trpc';

// const userClientP = p.use(isUserClientM);

export const userRouter = router({
  getClientState: p.query(({ctx}) => {
    return ctx.client.getPublicState();
    // return state.role;
    // return ctx.client.connectionId;
    // return 'Test' as const;
  }),
  subOwnClientState: userClientP.subscription(({ctx}) => {
    return attachToEvent(ctx.client.userClientEvent, 'myStateUpdated');
  }),
});
