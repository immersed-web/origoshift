
import { isSenderClientM, procedure as p, router } from '../trpc/trpc';

const senderP = p.use(isSenderClientM);

export const senderRouter = router({
  getClientState: senderP.query(({ctx}) => {
    return ctx.client.getPublicState();
  })
});
