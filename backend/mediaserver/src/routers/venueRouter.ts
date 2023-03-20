import { Log } from 'debug-level';
const log = new Log('Venue:Router');
process.env.DEBUG = 'Venue:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { hasAtLeastSecurityLevel, VenueId, VenueIdSchema, VenueUpdateSchema } from 'schemas';
import { z } from 'zod';
import { procedure as p, atLeastModeratorP, router, isInVenueM, atLeastSenderP, isUserClientM, isSenderClientM, isVenueOwnerM, clientInVenueP } from '../trpc/trpc';
// import Venue from '../classes/Venue';
import { SenderClient, UserClient, Venue } from '../classes/InternalClasses';
import prismaClient from '../modules/prismaClient';
import { TRPCError } from '@trpc/server';
import type { Prisma } from 'database';
import { attachToEvent, attachToFilteredEvent } from '../trpc/trpc-utils';

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

    const deletedVenue = await prismaClient.venue.delete({
      where
    });
    return deletedVenue.venueId;
    // return dbResponse;
  }),
  loadVenue: atLeastModeratorP.input(z.object({venueId: VenueIdSchema})).mutation(async ({input, ctx}) => {
    const venue = await Venue.loadVenue(input.venueId, ctx.userId);
    return venue.getPublicState();
  }),
  subVenueUnloaded: p.subscription(({ctx}) => {
    attachToEvent(ctx.client.clientEvent, 'venueWasUnloaded');
  }),
  listMyVenues: atLeastModeratorP.query(async ({ctx}) => {
    return ctx.client.ownedVenues.map(({venueId, name}) => ({venueId: venueId as VenueId, name}));
  }),
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
    await ctx.client.joinVenue(input.venueId);
    return ctx.client.venue?.getPublicState();
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
  subSomeSenderStateUpdated: atLeastModeratorP.subscription(({ctx}) => {
    log.info(`${ctx.username} (${ctx.connectionId}) started subscribing to senderState`);
    return attachToFilteredEvent(ctx.client.clientEvent, 'someClientStateUpdated', (data) => {
      if(data.clientState.connectionId === ctx.connectionId) return false;
      if(data.clientState.clientType === 'client') return false;
      return true;
    }, ({clientState, reason}) => ({senderState: clientState as ReturnType<SenderClient['getPublicState']>, reason}));
  }),
  subSenderAddedOrRemoved: p.use(isVenueOwnerM).subscription(({ctx}) => {
    return attachToFilteredEvent(ctx.client.clientEvent, 'senderAddedOrRemoved', ctx.connectionId);
  }),
  // joinVenueAsSender: atLeastSenderP.use(isSenderClientM).input(z.object({venueId: VenueIdSchema}))
  //   .mutation(async ({ctx, input}) =>{
  //     log.info('request received to join venue as sender:', input.venueId);
  //     await ctx.client.joinVenue(input.venueId);
  //   }),
  updateVenue: p.use(isVenueOwnerM).input(VenueUpdateSchema).mutation(({input, ctx}) =>{
    if(ctx.venue){
      ctx.venue.update(input);
    }
  }),
  leaveCurrentVenue: p.use(isInVenueM).mutation(({ctx}) => {
    if(!ctx.client.leaveCurrentVenue()){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'cant leave if not in a venue.. Duh!'});
    }
  })
});

