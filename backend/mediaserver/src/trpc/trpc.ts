import { initTRPC, TRPCError } from '@trpc/server';
import { Connection, SenderClient, UserClient } from '../classes/InternalClasses';
import { JwtUserData, ConnectionId, hasAtLeastSecurityLevel } from 'schemas';
// import type { Context } from 'index';

export type Context = JwtUserData & {
  // userId: UserId
  // uuid: JwtUserData['uuid']
  // jwt: JwtUserData
  connectionId: ConnectionId
  // client: UserClient
  connection: Connection
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
export const senderP = procedure.use(createAuthMiddleware('sender'));
export const userP = procedure.use(createAuthMiddleware('user'));



export const isBaseClientM = middleware(({ctx, next}) =>{
  const c = ctx.connection.client;
  if(!c){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'no backend client instance created. One needs to be created to do most stuff.'});
  }
  return next({
    ctx: {
      client: c
    }
  });
});

export const isUserClientM = middleware(({ctx, next}) =>{
  const c = ctx.connection.client;
  if(!c){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'no backend client instance created. One needs to be created to do most stuff.'});
  }
  if(!(c instanceof UserClient)){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You must be a user client (not a sender client) to perform that action'});
  }
  return next({
    ctx: {
      client: c
    }
  });
});

export const isSenderClientM = middleware(({ctx, next}) =>{
  const c = ctx.connection.client;
  if(!c){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'no backend client instance created. One needs to be created to do most stuff.'});
  }
  if(!(c instanceof SenderClient)){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You must be a sender client (not a user client) to perform that action'});
  }
  return next({
    ctx: {
      client: c
    }
  });
});

export const isInVenueM = middleware(({ctx, next})=> {
  if(!ctx.connection.client){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You must have a backend client instance created before attempting something like that'});
  }
  const venue = ctx.connection.client.venue;
  if(!venue) {
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You have to be added to a venue before performing that action!'});
  }
  // const venueId = venue.venueId;
  return next({ctx: {
    venue
  }});
});

export const isVenueOwnerM = isInVenueM.unstable_pipe(({ctx, next}) => {
  if(ctx.venue.ownerId !== ctx.userId){
    throw new TRPCError({code: 'FORBIDDEN', message: 'you are not the owner of this venue. Not allowed!'});
  }
  return next();
});

export const venueAdminP = moderatorP.use(isUserClientM).use(isVenueOwnerM);

export const userInVenueP = procedure.use(isUserClientM).use(isInVenueM);
