import { Log } from 'debug-level';
const log = new Log('VR:Router');
process.env.DEBUG = 'VR:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransformSchema } from 'schemas';
import { procedure as p, router, isVenueOwnerM, isUserClientM, userInVenueP, currentVenueAdminP, currentVenueHasVrSpace, currentVenueHasNoVrSpace } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';

export const vrRouter = router({
  createVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasNoVrSpace).mutation(({ctx}) => {
    ctx.venue.CreateAndAddVirtualSpace();
  }),
  openVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpace).mutation(({ctx}) => {
    ctx.vrSpace.open();
  }),
  closeVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpace).mutation(({ctx}) => {
    ctx.vrSpace.close();
  }),
  enterVrSpace: userInVenueP.use(currentVenueHasVrSpace).mutation(({ctx}) =>{
    if(!ctx.vrSpace.isOpen){
      throw new TRPCError({code: 'FORBIDDEN', message: 'The vr space is not opened to users at this point. Very sad!'});
    }
    ctx.vrSpace.addClient(ctx.client);
  }),
  getState: userInVenueP.use(currentVenueHasVrSpace).query(({ctx}) => {
    ctx.vrSpace.getPublicState();
  }),
  transforms: router({
    updateTransform: userInVenueP.use(currentVenueHasVrSpace).input(ClientTransformSchema).mutation(({input, ctx}) =>{
      log.debug(`transform received from ${ctx.username} (${ctx.connectionId})`);
      log.debug(input);
      const venue = ctx.client.venue;
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You are not in a venue. You shouldnt send transform data!'});
      }
      ctx.client.transform = input;
      const vrSpace = ctx.vrSpace;
      vrSpace.pendingTransforms[ctx.client.connectionId] = input;
      vrSpace.sendPendingTransforms();

    }),
    getClientTransforms: userInVenueP.use(currentVenueHasVrSpace).query(() => {
      return 'NOT IMPLEMENTED YET' as const;
    }),
    subClientTransforms: p.use(isUserClientM).use(currentVenueHasVrSpace).subscription(({ctx}) => {
      console.log(`${ctx.username} started subscription to transforms`);
      return attachEmitter(ctx.client.vrEvents, 'clientTransforms');
      // return attachEmitter(venue.vrSpace.emitter, 'transforms');
    })
  })
});
