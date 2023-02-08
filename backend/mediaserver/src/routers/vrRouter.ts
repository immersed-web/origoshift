import { JwtUserData, ClientPositionSchema, ClientPosition } from 'schemas';
// import { z } from 'zod';
import { middleware, procedure as p, procedure, router } from '../trpc/trpc';
import { TypedEmitter } from 'tiny-typed-emitter';
import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';


type VREvents = FilteredEvents<{
  'transforms': (transforms: ClientPositions) => void
}, JwtUserData['uuid']>

const ee = new TypedEmitter<VREvents>();

type ClientPositions = Record<JwtUserData['uuid'], ClientPosition>;
// const clientPositions = new Map<JwtUserData['uuid'], ClientPosition>();
const clientPositions: ClientPositions = {};

export const vrRouter = router({
  updateTransform: p.input(ClientPositionSchema).mutation(({input, ctx}) =>{
    clientPositions[ctx.uuid] = input;
    ee.emit('transforms', clientPositions, ctx.uuid);
  }),
  getClientTransforms: procedure.query(() => {
    return clientPositions;
  }),
  clientTransforms: p.subscription(({ctx}) => {
    return attachFilteredEmitter(ee, 'transforms', ctx.uuid);
  })
});
