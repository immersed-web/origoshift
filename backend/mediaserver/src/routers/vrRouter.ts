import { ClientTransformSchema } from 'schemas';
import { procedure as p, router } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';

import { Log } from 'debug-level';

const log = new Log('VR:Router');

process.env.DEBUG = 'VR:Router*, ' + process.env.DEBUG;
// log.enable(process.env.DEBUG);

// log.enable('VrRouter*');

// const Log = debug('VrRouter');


export const vrRouter = router({
  transforms: router({
    updateTransform: p.input(ClientTransformSchema).mutation(({input, ctx}) =>{
      log.debug(`transform received from ${ctx.username} (${ctx.connectionId})`);
      log.debug(input);
      const venue = ctx.client.getVenue();
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You are not in a venue. You shouldnt send transform data!'});
      }
      ctx.client.transform = input;
      const vrSpace = venue.vrSpace;
      vrSpace.pendingTransforms[ctx.client.connectionId] = input;
      vrSpace.sendPendingTransforms();

    }),
    getSelfId: p.query(({ctx}) => {
      return ctx.uuid;
    }),
    getClientTransforms: p.query(() => {
      return 'NOT IMPLEMENTED YET' as const;
    }),
    subClientTransforms: p.subscription(({ctx}) => {
      console.log(`${ctx.username} started subscription to transforms`);
      return attachEmitter(ctx.client.vrEvents, 'clientTransforms');
      // return attachEmitter(venue.vrSpace.emitter, 'transforms');
    })
  })
});
