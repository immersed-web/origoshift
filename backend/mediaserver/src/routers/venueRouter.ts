import { Log } from 'debug-level';
const log = new Log('Venue:Router');
process.env.DEBUG = 'Venue:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { hasAtLeastSecurityLevel, VenueIdSchema } from 'schemas';
import { z } from 'zod';
import { procedure as p, atLeastModeratorP, router, isInVenueM, atLeastSenderP, isUserClientM, isSenderClientM } from '../trpc/trpc';
// import Venue from '../classes/Venue';
import { Venue } from '../classes/InternalClasses';
import prismaClient from '../modules/prismaClient';
import { TRPCError } from '@trpc/server';
import type { Prisma } from 'database';
import { attachEmitter, attachFilteredEmitter } from '../trpc/trpc-utils';

export const venueRouter = router({
  createNewVenue: atLeastModeratorP.input(z.object({
    name: z.string()
  })).mutation(async ({input, ctx}) => {
    const venueId = await Venue.createNewVenue(input.name, ctx.userId);
    return venueId;
  }),
  deleteVenue: atLeastModeratorP.input(z.object({venueId: VenueIdSchema})).mutation(async ({ctx, input}) => {
    if(Venue.venueIsLoaded({venueId: input.venueId})){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'Cant delete a venue when its loaded. Unload it first!'});
    }
    let where: Prisma.VenueWhereUniqueInput = {
      ownerId_venueId: {
        ownerId: ctx.userId,
        venueId: input.venueId,
      }
    };
    if(hasAtLeastSecurityLevel(ctx.role, 'admin')){
      where = {
        venueId: input.venueId
      };
    }

    const dbResponse = await prismaClient.venue.delete({
      where
    });
    return dbResponse;
  }),
  loadVenue: atLeastModeratorP.input(z.object({venueId: VenueIdSchema})).mutation(async ({input, ctx}) => {
    const venue = await Venue.loadVenue(input.venueId, ctx.userId);
    return venue.getPublicState();
  }),
  subVenueUnloaded: p.subscription(({ctx}) => {
    attachEmitter(ctx.client.venueEvents, 'venueWasUnloaded');
  }),
  listMyVenues: atLeastModeratorP.query(async ({ctx}) => {
    // TODO: get directly from the client instance as it loads db data when created
    const dbResponse = await prismaClient.venue.findMany({
      where: {
        ownerId: ctx.userId
      },
      select: {
        venueId: true,
        name: true,
      }
    });
    return dbResponse;
  }),
  listAllowedVenues: p.query(({ctx}) => {
    return ctx.client.allowedVenues;
  }),
  subClientAddedOrRemoved: p.use(isUserClientM).subscription(({ctx}) => {
    return attachFilteredEmitter(ctx.client.venueEvents, 'clientAddedOrRemoved', ctx.connectionId);
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
    await ctx.client.joinVenue(input.venueId);
    return ctx.client.venue?.getPublicState();
  }),
  // joinVenueAsSender: atLeastSenderP.use(isSenderClientM).input(z.object({venueId: VenueIdSchema}))
  //   .mutation(async ({ctx, input}) =>{
  //     log.info('request received to join venue as sender:', input.venueId);
  //     await ctx.client.joinVenue(input.venueId);
  //   }),
  leaveCurrentVenue: p.use(isInVenueM).mutation(({ctx}) => {
    if(!ctx.client.leaveCurrentVenue()){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'cant leave if not in a venue.. Duh!'});
    }
  })
});

