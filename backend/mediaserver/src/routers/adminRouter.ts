import { Log } from 'debug-level';
const log = new Log('Router:Admin');
process.env.DEBUG = 'Router:Admin*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { SenderClient, UserClient, Venue } from '../classes/InternalClasses';
import { Prisma } from 'database';
import prismaClient from '../modules/prismaClient';
import { hasAtLeastSecurityLevel, VenueId, VenueIdSchema, VenueUpdateSchema } from 'schemas';
import { attachToEvent, attachToFilteredEvent, NotifierInputData } from '../trpc/trpc-utils';
import { z } from 'zod';
import { atLeastModeratorP, isUserClientM, isVenueOwnerM, procedure as p, router } from '../trpc/trpc';


export const adminRouter = router({
  subProducerCreated: atLeastModeratorP.subscription(({ctx}) => {
    return attachToFilteredEvent(ctx.client.clientEvent, 'producerCreated', ctx.connectionId);
  }),
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
  subVenueStateUpdated: atLeastModeratorP.use(isUserClientM).subscription(({ctx}) => {
    return observable<NotifierInputData<UserClient['notify']['venueStateUpdated']>>((scriber) => {
      ctx.client.notify.venueStateUpdated = scriber.next;
      return () => ctx.client.notify.venueStateUpdated = undefined;
    });
  }),
  listMyVenues: atLeastModeratorP.query(async ({ctx}) => {
    return ctx.client.ownedVenues.map(({venueId, name}) => ({venueId: venueId as VenueId, name}));
  }),
  subSenderAddedOrRemoved: p.use(isVenueOwnerM).subscription(({ctx}) => {
    return attachToFilteredEvent(ctx.client.clientEvent, 'senderAddedOrRemoved', ctx.connectionId);
  }),
  subSomeSenderStateUpdated: atLeastModeratorP.subscription(({ctx}) => {
    log.info(`${ctx.username} (${ctx.connectionId}) started subscribing to senderState`);
    return attachToFilteredEvent(ctx.client.clientEvent, 'someClientStateUpdated', (data) => {
      if(data.clientState.connectionId === ctx.connectionId) return false;
      if(data.clientState.clientType === 'client') return false;
      return true;
    }, ({clientState, reason}) => ({senderState: clientState as ReturnType<SenderClient['getPublicState']>, reason}));
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
});
