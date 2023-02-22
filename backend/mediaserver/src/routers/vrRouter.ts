import { ClientTransformSchema } from 'schemas';
import { moderatorP, procedure as p, router, isVenueOwnerM, isInVenueM } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';

import { Log } from 'debug-level';

const log = new Log('VR:Router');

process.env.DEBUG = 'VR:Router*, ' + process.env.DEBUG;
// log.enable(process.env.DEBUG);

// log.enable('VrRouter*');

// const Log = debug('VrRouter');


export const vrRouter = router({
  openVrSpace: moderatorP.use(isVenueOwnerM).mutation(({ctx}) => {
    ctx.venue.vrSpace.open();
  }),
  closeVrSpace: moderatorP.use(isVenueOwnerM).mutation(({ctx}) => {
    ctx.venue.vrSpace.close();
  }),
  enterVrSpace: p.use(isInVenueM).mutation(({ctx}) =>{
    if(!ctx.venue.vrSpace.isOpen){
      throw new TRPCError({code: 'FORBIDDEN', message: 'The vr space is not opened to users at this point. Very sad!'});
    }
    ctx.venue.vrSpace.addClient(ctx.client);
  }),
  transforms: router({
    updateTransform: p.input(ClientTransformSchema).mutation(({input, ctx}) =>{
      log.debug(`transform received from ${ctx.username} (${ctx.connectionId})`);
      log.debug(input);
      const venue = ctx.client.venue;
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You are not in a venue. You shouldnt send transform data!'});
      }
      ctx.client.transform = input;
      const vrSpace = venue.vrSpace;
      vrSpace.pendingTransforms[ctx.client.connectionId] = input;
      vrSpace.sendPendingTransforms();

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
