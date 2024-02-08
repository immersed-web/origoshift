import { Log } from 'debug-level';
const log = new Log('Router:Venue');
process.env.DEBUG = 'Router:Venue*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { VenueListInfo, VenueIdSchema } from 'schemas';
import { z } from 'zod';
import { procedure as p, atLeastModeratorP, router, isInVenueM, isUserClientM, clientInVenueP } from '../trpc/trpc';
import { UserClient, Venue } from '../classes/InternalClasses';
import prismaClient from '../modules/prismaClient';
import { TRPCError } from '@trpc/server';
import { attachToEvent, attachToFilteredEvent, NotifierInputData, NotifierSignature} from '../trpc/trpc-utils';
import { observable } from '@trpc/server/observable';
import { uniqBy } from 'lodash';

type VenueStateUpdate = NotifierSignature<ReturnType<Venue['getPublicState']>>;

export const venueRouter = router({
  listAllowedVenues: p.query(async ({ctx}) => {
    const publicVenues = await prismaClient.venue.findMany({
      where: {
        visibility: {
          equals: 'public'
        }
      },
      select: {
        name: true,
        venueId: true,
        doorsAutoOpen: true,
        doorsOpeningTime: true,
        doorsManuallyOpened: true,
        streamAutoStart: true,
        streamStartTime: true,
        streamManuallyEnded: true,
        streamManuallyStarted: true,
        visibility: true,
      } satisfies Record<keyof VenueListInfo, true>
    }) as VenueListInfo[];
    const assembledVenues = uniqBy([...publicVenues, ...ctx.client.allowedVenues.value], 'venueId');

    return assembledVenues;
  }),
  getVenueListInfo: p.input(z.object({
    venueId: VenueIdSchema,
  })).query(async ({input, ctx}) => {
    try {
      const venueInfo = await prismaClient.venue.findUniqueOrThrow({
        where: {
          venueId: input.venueId
        },
        select: {
          name: true,
          venueId: true,
          doorsAutoOpen: true,
          doorsOpeningTime: true,
          doorsManuallyOpened: true,
          streamAutoStart: true,
          streamStartTime: true,
          streamManuallyEnded: true,
          streamManuallyStarted: true,
          visibility: true,
        } satisfies Record<keyof VenueListInfo, true>
      });
      return venueInfo as VenueListInfo;
    } catch(e) {
      log.error(e);
      throw new TRPCError({ code: 'NOT_FOUND', message: 'didn\'t find that Venue'});
    }
  }),
  // subClientAddedOrRemoved: p.use(isUserClientM).subscription(({ctx}) => {
  //   return attachToFilteredEvent(ctx.client.clientEvent, 'clientAddedOrRemoved', ctx.connectionId);
  // }),
  // listLoadedVenues: p.query(({ctx}) => {
  //   return Venue.getLoadedVenues();
  // }),
  // listLoadedVenuesPublicState: p.query(({ctx}) => {
  //   return Venue.getLoadedVenuesPublicState();
  // }),
  loadAndJoinVenue: p.input(z.object({venueId: VenueIdSchema})).mutation(async ({input, ctx}) => {
    await Venue.loadVenue(input.venueId, ctx.userId);
    const vState = await ctx.client.joinVenue(input.venueId);
    return vState;
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
  subVenueStateUpdated: p.subscription(({ctx}) => {
    log.info(`attching venueStateUpdated notifier for client: ${ctx.username} (${ctx.connectionId})`);
    return observable<NotifierInputData<VenueStateUpdate>>((scriber) => {
      ctx.client.notify.venueStateUpdated = scriber.next;
      return () => ctx.client.notify.venueStateUpdated = undefined;
    });
  }),
  subVenueUnloaded: p.subscription(({ctx}) => {
    return attachToEvent(ctx.client.clientEvent, 'venueWasUnloaded');
  }),
  // subSomeClientStateUpdated: atLeastModeratorP.subscription(({ctx}) => {
  //   log.info(`${ctx.username} (${ctx.connectionId}) started subscribing to clientState`);
  //   return attachToFilteredEvent(ctx.client.clientEvent, 'someClientStateUpdated', (data) => {
  //     if(data.clientState.connectionId === ctx.connectionId) return false;
  //     if(data.clientState.clientType === 'sender') return false;
  //     return true;
  //   }, ({clientState, reason}) => ({clientState: clientState as ReturnType<UserClient['getPublicState']>, reason}));
  // }),
  leaveCurrentVenue: p.use(isInVenueM).mutation(({ctx}) => {
    if(!ctx.client.leaveCurrentVenue()){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'cant leave if not in a venue.. Duh!'});
    }
  })
});

