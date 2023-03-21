import { Log } from 'debug-level';
const log = new Log('VR:Router');
process.env.DEBUG = 'VR:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { ClientTransformSchema, VirtualSpace3DModelCreateSchema, VirtualSpace3DModelRemoveSchema } from 'schemas';
import { procedure as p, router, isVenueOwnerM, isUserClientM, userInVenueP, currentVenueAdminP, currentVenueHasVrSpaceM, currentVenueHasNoVrSpaceM, currentVrSpaceHasModelM } from '../trpc/trpc';
import { attachToEvent } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';

export const vrRouter = router({
  createVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasNoVrSpaceM).mutation(({ctx}) => {
    ctx.venue.CreateAndAddVirtualSpace();
  }),
  openVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpaceM).mutation(({ctx}) => {
    ctx.vrSpace.open();
  }),
  closeVrSpace: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpaceM).mutation(({ctx}) => {
    ctx.vrSpace.close();
  }),
  enterVrSpace: userInVenueP.use(currentVenueHasVrSpaceM).mutation(({ctx}) =>{
    if(!ctx.vrSpace.isOpen){
      throw new TRPCError({code: 'FORBIDDEN', message: 'The vr space is not opened to users at this point. Very sad!'});
    }
    ctx.vrSpace.addClient(ctx.client);
  }),
  getState: userInVenueP.use(currentVenueHasVrSpaceM).query(({ctx}) => {
    ctx.vrSpace.getPublicState();
  }),
  create3DModel: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpaceM).input(VirtualSpace3DModelCreateSchema).mutation(({input, ctx}) => {
    ctx.venue.Create3DModel(input.modelUrl);
  }),
  remove3DModel: currentVenueAdminP.use(isVenueOwnerM).use(currentVenueHasVrSpaceM).input(VirtualSpace3DModelRemoveSchema).mutation(({input, ctx}) => {
    ctx.venue.Remove3DModel(input.modelId);
  }),
  updateNavmesh: currentVenueAdminP.use(isVenueOwnerM).use(currentVrSpaceHasModelM).input(VirtualSpace3DModelCreateSchema).mutation(({input, ctx}) => {
    ctx.venue.UpdateNavmesh(input.modelUrl);
  }),
  transforms: router({
    updateTransform: userInVenueP.use(currentVenueHasVrSpaceM).input(ClientTransformSchema).mutation(({input, ctx}) =>{
      log.debug(`transform received from ${ctx.username} (${ctx.connectionId})`);
      log.debug(input);
      const venue = ctx.venue;
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You are not in a venue. You shouldnt send transform data!'});
      }
      ctx.client.transform = input;
      const vrSpace = ctx.vrSpace;
      vrSpace.pendingTransforms[ctx.connectionId] = input;
      vrSpace.sendPendingTransforms();

    }),
    getClientTransforms: userInVenueP.use(currentVenueHasVrSpaceM).query(() => {
      return 'NOT IMPLEMENTED YET' as const;
    }),
    subClientTransforms: p.use(isUserClientM).subscription(({ctx}) => {
      console.log(`${ctx.username} started subscription to transforms`);
      return attachToEvent(ctx.client.userClientEvent, 'clientTransforms');
      // return attachEmitter(venue.vrSpace.emitter, 'transforms');
    })
  })
});
