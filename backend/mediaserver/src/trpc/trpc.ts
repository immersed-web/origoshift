import { initTRPC, TRPCError } from '@trpc/server';
import { Client } from 'classes/InternalClasses';
import { JwtUserData, UserId, ConnectionId, hasAtLeastSecurityLevel } from 'schemas';
// import type { Context } from 'index';

export type Context = JwtUserData & {
  // userId: UserId
  // uuid: JwtUserData['uuid']
  // jwt: JwtUserData
  connectionId: ConnectionId
  client: Client
}
const trpc = initTRPC.context<Context>().create();

export const middleware = trpc.middleware;
export const router = trpc.router;
export const procedure = trpc.procedure;

export const createAuthMiddleware = (userRole: JwtUserData['role']) => {
  return middleware(({ctx, next}) => {
    if(!hasAtLeastSecurityLevel(ctx.role, userRole)){
      throw new TRPCError({code: 'UNAUTHORIZED', message: 'Du saknar behörighet! Vi uppskattar INTE dina försök att kringå dina befogenheter!'});
    }
    return next();
  });
};

export const superadminP = procedure.use(createAuthMiddleware('superadmin'));
export const adminP = procedure.use(createAuthMiddleware('admin'));
export const moderatorP = procedure.use(createAuthMiddleware('moderator'));
export const userP = procedure.use(createAuthMiddleware('user'));

const isInsideAVenue = middleware(({ctx, next})=> {
  const venue = ctx.client.venue;
  if(!venue) {
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You have to be added to a venue before performing that action!'});
  }
  // const venueId = venue.venueId;
  return next({ctx: {
    venue
  }});
});

export const isInVenueM = isInsideAVenue;

export const isVenueOwnerM = isInsideAVenue.unstable_pipe(({ctx, next}) => {
  if(ctx.venue.ownerId !== ctx.userId){
    throw new TRPCError({code: 'FORBIDDEN', message: 'you are not the owner of this venue. Not allowed!'});
  }
  return next();
});
