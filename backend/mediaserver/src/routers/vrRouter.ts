import { Log } from 'debug-level';
const log = new Log('VR:Router');
process.env.DEBUG = 'VR:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransformSchema } from 'schemas';
import { procedure as p, router, isVenueOwnerM, isUserClientM, venueAdminP, userInVenueP } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';

export const vrRouter = router({
  openVrSpace: venueAdminP.use(isVenueOwnerM).mutation(({ctx}) => {
    ctx.venue.vrSpace.open();
  }),
  closeVrSpace: venueAdminP.use(isVenueOwnerM).mutation(({ctx}) => {
    ctx.venue.vrSpace.close();
  }),
  enterVrSpace: userInVenueP.mutation(({ctx}) =>{
    if(!ctx.venue.vrSpace.isOpen){
      throw new TRPCError({code: 'FORBIDDEN', message: 'The vr space is not opened to users at this point. Very sad!'});
    }
    ctx.venue.vrSpace.addClient(ctx.client);
  }),
  getState: userInVenueP.query(({ctx}) => {
    ctx.venue.vrSpace.getPublicState();
  }),
  transforms: router({
    updateTransform: userInVenueP.input(ClientTransformSchema).mutation(({input, ctx}) =>{
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
    getClientTransforms: userInVenueP.query(() => {
      return 'NOT IMPLEMENTED YET' as const;
    }),
    subClientTransforms: p.use(isUserClientM).subscription(({ctx}) => {
      console.log(`${ctx.username} started subscription to transforms`);
      return attachEmitter(ctx.client.vrEvents, 'clientTransforms');
      // return attachEmitter(venue.vrSpace.emitter, 'transforms');
    })
  })
});
