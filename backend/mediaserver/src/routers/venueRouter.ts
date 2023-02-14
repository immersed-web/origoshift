import { UuidSchema } from 'schemas';
import { z } from 'zod';
import { middleware, procedure as p, moderatorP, router } from '../trpc/trpc';
import Venue from '../classes/Venue';
import prismaClient from '../modules/prismaClient';
import { TRPCError } from '@trpc/server';
import type {} from 'database';

export const venueRouter = router({
  createNewVenue: moderatorP.input(z.object({
    name: z.string()
  })).mutation(async ({input, ctx}) => {
    const venueId = await Venue.createNewVenue(input.name, ctx.uuid);
    return venueId;
  }),
  deleteVenue: moderatorP.input(z.object({uuid: z.string().uuid()})).mutation(async ({ctx, input}) => {
    if(Venue.venueIsLoaded({venueId: input.uuid})){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'Cant delete a venue when its loaded. Unload it first!'});
    }
    const dbResponse = await prismaClient.venue.delete({
      where: {
        uuid: input.uuid
      }
    });
    return dbResponse;
  }),
  loadVenue: moderatorP.input(z.object({uuid: z.string().uuid()})).mutation(({input}) => {
    Venue.loadVenue(input.uuid);
  }),
  listMyVenues: moderatorP.query(async ({ctx}) => {
    const dbResponse = await prismaClient.venue.findMany({
      where: {
        ownerId: ctx.uuid
      },
      select: {
        uuid: true,
        name: true,
      }
    });
    return dbResponse;
  }),
  listLoadedVenue: p.query(({ctx}) => {
    return Venue.getLoadedVenues();
  }),
  joinVenue: p.input(
    z.object({
      uuid: UuidSchema
    })
  ).mutation(({input, ctx}) => {
    ctx.client.leaveCurrentVenue();
    const venue = Venue.getVenue({uuid: input.uuid});
    venue.addClient(ctx.client);
  }),
  leaveCurrentVenue: p.query(({ctx}) => {
    if(!ctx.client.leaveCurrentVenue()){
      throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'cant leave if not in a venue.. Duh!'});
    }
  })
});

