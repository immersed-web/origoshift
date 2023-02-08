import { UuidSchema } from 'schemas';
import { z } from 'zod';
import { middleware, procedure as p, procedure, router } from '../trpc/trpc';
import { TypedEmitter } from 'tiny-typed-emitter';
import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';
import Venue from '../classes/Venue';


// type VREvents = FilteredEvents<{
//   'transforms': (transforms: ClientTransforms) => void
// }, JwtUserData['uuid']>


export const venueRouter = router({
  createNewVenue: p.input(z.object({
    name: z.string()
  })).mutation(({input, ctx}) => {
    Venue.createNewVenue(input.name);
  }),
  spinUpVenue: p.input(z.object({uuid: z.string().uuid()})).mutation(({input}) => {
    Venue.instantiateVenue(input.uuid);
  }),
  joinVenue: p.input(
    z.object({
      venueUuid: UuidSchema
    })
  ).mutation(({input}) => {
    Venue.getVenue({uuid: input.venueUuid});
  })
});

