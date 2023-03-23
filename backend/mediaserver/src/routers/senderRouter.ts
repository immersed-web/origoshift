import { Log } from 'debug-level';
const log = new Log('Router:Sender');
process.env.DEBUG = 'Router:Sender*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { SenderIdSchema } from 'schemas';
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
  setSenderId: senderClientP.input(SenderIdSchema).mutation(({ctx, input}) => {

    log.info('received new senderID from client:', input);
    ctx.client.senderId = input;
  })
});
