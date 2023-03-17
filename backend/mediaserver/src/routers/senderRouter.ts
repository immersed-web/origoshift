import { isSenderClientM, procedure as p, router } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';

const senderClientP = p.use(isSenderClientM);

export const senderRouter = router({
  getClientState: senderClientP.query(({ctx}) => {
    return ctx.client.getPublicState();
  }),
  subOwnClientState: senderClientP.subscription(({ctx}) => {
    return attachEmitter(ctx.client.senderClientEvent, 'myStateUpdated');
  }),
});
