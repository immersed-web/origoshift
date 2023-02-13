import { ClientTransformSchema } from 'schemas';
// import { z } from 'zod';
import { middleware, procedure as p, procedure, router } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
import { TRPCError } from '@trpc/server';




export const vrRouter = router({
  transforms: router({
    updateTransform: p.input(ClientTransformSchema).mutation(({input, ctx}) =>{
      const venue = ctx.client.getVenue();
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You are not in a venue. You shouldnt send transform data!'});
      }
      const vrSpace = venue.vrSpace;
      vrSpace.pendingTransforms[ctx.client.connectionId] = input;
      vrSpace.sendPendingTransforms();

    }),
    // clearTransforms: p.mutation(({input, ctx}) =>{

    //   // ee.emit('transforms', clientTransforms, '');
    // }),
    getSelfId: procedure.query(({ctx}) => {
      return ctx.uuid;
    }),
    getClientTransforms: procedure.query(() => {
      return 'NOT IMPLEMENTED YET' as const;
    }),
    clientTransformsSub: p.subscription(({ctx}) => {
      const venue = ctx.client.getVenue();
      if(!venue){
        throw new TRPCError({code: 'PRECONDITION_FAILED', message: ' Not ina venue. Not possible'});
      }
      return attachEmitter(ctx.client.emitter, 'clientTransforms');
      // return attachEmitter(venue.vrSpace.emitter, 'transforms');
    })
  })
});
