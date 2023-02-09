import { UuidSchema } from 'schemas';
import { z } from 'zod';
import { middleware, procedure as p, moderatorP, router } from '../trpc/trpc';
import { TypedEmitter } from 'tiny-typed-emitter';
import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';
import Venue from '../classes/Venue';


// type VREvents = FilteredEvents<{
//   'transforms': (transforms: ClientTransforms) => void
// }, JwtUserData['uuid']>


export const venueRouter = router({
  createNewVenue: moderatorP.input(z.object({
    name: z.string()
  })).mutation(({input, ctx}) => {
    Venue.createNewVenue(input.name, ctx.uuid);
  }),
  loadVenue: moderatorP.input(z.object({uuid: z.string().uuid()})).mutation(({input}) => {
    Venue.loadVenue(input.uuid);
  }),
  joinVenue: p.input(
    z.object({
      venueUuid: UuidSchema
    })
  ).mutation(({input, ctx}) => {
    const venue = Venue.getVenue({uuid: input.venueUuid});
    venue.addClient(ctx.client);

  })
});

