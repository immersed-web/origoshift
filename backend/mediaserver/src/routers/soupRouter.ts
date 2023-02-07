import { JwtUserData } from 'schemas';
import { z } from 'zod';
import { middleware, procedure as p, procedure, router } from '../trpc/trpc';
import { TypedEmitter } from 'tiny-typed-emitter';
import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';
// import { t } from '../index';

// const appendClientInstance = middleware(({ctx, next}) => {

// })
type SoupEvents = FilteredEvents<{
  'producerClosed': (producerUuid: string) => void
}, JwtUserData['uuid']>

const ee = new TypedEmitter<SoupEvents>();

export const soupRouter = router({
  getRTPCapabilities: p.query(() => {
    return 'Not implemented yet' as const;
  }),
  closeProducer: p.input(z.object({producerId:z.string().uuid()})).mutation(({input, ctx}) => {
    ee.emit('producerClosed', input.producerId, ctx.uuid);
  }),
  onProducerClosed: p.input(z.string().uuid()).subscription(({input, ctx}) => {
    attachFilteredEmitter(ee, 'producerClosed', ctx.uuid);
  })
});
