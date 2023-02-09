import { JwtUserData, ClientTransformSchema, ClientTransform } from 'schemas';
// import { z } from 'zod';
import { middleware, procedure as p, procedure, router } from '../trpc/trpc';
import { TypedEmitter } from 'tiny-typed-emitter';
import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';


type VREvents = FilteredEvents<{
  'transforms': (transforms: ClientTransforms) => void
}, JwtUserData['uuid']>

const ee = new TypedEmitter<VREvents>();

type ClientTransforms = Record<JwtUserData['uuid'], ClientTransform>;
// const clientPositions = new Map<JwtUserData['uuid'], ClientPosition>();
let clientTransforms: ClientTransforms = {};

export const vrRouter = router({
  transforms: router({
    updateTransform: p.input(ClientTransformSchema).mutation(({input, ctx}) =>{
      clientTransforms[ctx.uuid] = input;
      ee.emit('transforms', clientTransforms, ctx.uuid);
    }),
    clearTransforms: p.mutation(({input, ctx}) =>{
      clientTransforms = {}
      ee.emit('transforms', clientTransforms, '');
    }),
    getClientTransforms: procedure.query(() => {
      return clientTransforms;
    }),
    clientTransformsSub: p.subscription(({ctx}) => {
      return attachFilteredEmitter(ee, 'transforms', ctx.uuid);
    })
  })
});
