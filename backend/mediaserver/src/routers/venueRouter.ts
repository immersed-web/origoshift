import { Log } from 'debug-level';
const log = new Log('Router:Venue');
process.env.DEBUG = 'Router:Venue*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { hasAtLeastSecurityLevel, VenueId, VenueIdSchema, VenueUpdateSchema } from 'schemas';
import { z } from 'zod';
import { procedure as p, atLeastModeratorP, router, isInVenueM, atLeastSenderP, isUserClientM, isSenderClientM, isVenueOwnerM, clientInVenueP } from '../trpc/trpc';
// import Venue from '../classes/Venue';
import { SenderClient, UserClient, Venue } from '../classes/InternalClasses';
import prismaClient from '../modules/prismaClient';
import { TRPCError } from '@trpc/server';
import type { Prisma } from 'database';
import { attachToEvent, attachToFilteredEvent, NotifierInputData } from '../trpc/trpc-utils';
import { observable } from '@trpc/server/observable';

export const venueRouter = router({
  listAllowedVenues: p.query(({ctx}) => {
    return ctx.client.allowedVenues.map(({venueId, name}) => {
      return {venueId: venueId as VenueId, name};
    });
  }),
  subClientAddedOrRemoved: p.use(isUserClientM).subscription(({ctx}) => {
    return attachToFilteredEvent(ctx.client.clientEvent, 'clientAddedOrRemoved', ctx.connectionId);
  }),
  listLoadedVenues: p.query(({ctx}) => {
    return Venue.getLoadedVenues();
  }),
  joinVenue: p.input(
    z.object({
      venueId: VenueIdSchema
    })
  ).mutation(async ({input, ctx}) => {
    log.info(`request received to join venue as ${ctx.client.clientType}:`, input.venueId);
    const vState = await ctx.client.joinVenue(input.venueId);
    return vState;
  }),
  getVenueState: clientInVenueP.query(({ctx}) => {
    return ctx.venue.getPublicState();
  }),
  subSomeClientStateUpdated: atLeastModeratorP.subscription(({ctx}) => {
    log.info(`${ctx.username} (${ctx.connectionId}) started subscribing to clientState`);
    return attachToFilteredEvent(ctx.client.clientEvent, 'someClientStateUpdated', (data) => {
      if(data.clientState.connectionId === ctx.connectionId) return false;
      if(data.clientState.clientType === 'sender') return false;
      return true;
    }, ({clientState, reason}) => ({clientState: clientState as ReturnType<UserClient['getPublicState']>, reason}));
  }),
  leaveCurrentVenue: p.use(isInVenueM).mutation(({ctx}) => {
    if(!ctx.client.leaveCurrentVenue()){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'cant leave if not in a venue.. Duh!'});
    }
  })
});

