import { isSenderClientM, procedure as p, router } from '../trpc/trpc';
import { attachToEvent } from '../trpc/trpc-utils';

const senderClientP = p.use(isSenderClientM);

export const senderRouter = router({
  getClientState: senderClientP.query(({ctx}) => {
    return ctx.client.getPublicState();
  }),
  subOwnClientState: senderClientP.subscription(({ctx}) => {
    return attachToEvent(ctx.client.senderClientEvent, 'myStateUpdated');
  }),
});
