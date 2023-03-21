import { initTRPC, TRPCError } from '@trpc/server';
import { SenderClient, UserClient } from '../classes/InternalClasses';
import { JwtUserData, ConnectionId, hasAtLeastSecurityLevel, ClientType } from 'schemas';
// import { z } from 'zod';
import superjson from 'superjson';

export type Context = JwtUserData & {
  // userId: UserId
  // uuid: JwtUserData['uuid']
  // jwt: JwtUserData
  connectionId: ConnectionId
  client: UserClient | SenderClient
  clientType: ClientType
  // connection: Connection
}
const trpc = initTRPC.context<Context>().create({
  transformer: superjson,
  // transformer: {
  //   serialize: pack,
  //   deserialize: unpack,
  // }
});

export const middleware = trpc.middleware;
export const router = trpc.router;
export const procedure = trpc.procedure;

const createAuthMiddleware = (userRole: JwtUserData['role']) => {
  return middleware(({ctx, next}) => {
    if(!hasAtLeastSecurityLevel(ctx.role, userRole)){
      throw new TRPCError({code: 'UNAUTHORIZED', message: 'Du saknar behörighet! Vi uppskattar INTE dina försök att kringå dina befogenheter!'});
    }
    return next();
  });
};

export const atLeastSuperadminP = procedure.use(createAuthMiddleware('superadmin'));
export const atLeastAdminP = procedure.use(createAuthMiddleware('admin'));
export const atLeastModeratorP = procedure.use(createAuthMiddleware('moderator'));
export const atLeastSenderP = procedure.use(createAuthMiddleware('sender'));
export const atLeastUserP = procedure.use(createAuthMiddleware('user'));



export const isUserClientM = middleware(({ctx, next}) =>{
  if(!(ctx.client instanceof UserClient)){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You must be a user client (not a sender client) to perform that action'});
  }
  return next({
    ctx: {
      client: ctx.client
    }
  });
});

export const isSenderClientM = middleware(({ctx, next}) =>{
  if(!(ctx.client instanceof SenderClient)){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You must be a sender client (not a user client) to perform that action'});
  }
  return next({
    ctx: {
      client: ctx.client
    }
  });
});

export const userClientP = procedure.use(isUserClientM);
export const senderClientP = procedure.use(isSenderClientM);

export const isInVenueM = middleware(({ctx, next})=> {
  const venue = ctx.client.venue;
  if(!venue) {
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'You have to be added to a venue before performing that action!'});
  }
  return next({ctx: {
    venue
  }});
});

export const currentVenueHasVrSpaceM = isInVenueM.unstable_pipe(({ctx, next}) => {
  if(!ctx.venue.vrSpace){
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'the venue doesnt have a vr space. Now cry!'});
  }
  return next({
    ctx: {
      vrSpace: ctx.venue.vrSpace,
    }
  });
});

export const currentVrSpaceHasModelM = isInVenueM.unstable_pipe(({ctx, next}) => {
  if(!ctx.venue.vrSpace?.getPublicState().virtualSpace3DModel){
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'the VR space doesnt have a model. Now cry!'});
  }
  return next({
    ctx: {
      vr3DModel: ctx.venue.vrSpace.getPublicState().virtualSpace3DModel,
    }
  });
});

export const currentVenueHasNoVrSpaceM = isInVenueM.unstable_pipe(({ctx, next}) => {
  if(ctx.venue.vrSpace){
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'the venue already have a vr space.'});
  }
  return next();
});

export const isVenueOwnerM = isInVenueM.unstable_pipe(({ctx, next}) => {
  if(ctx.venue.ownerId !== ctx.userId){
    throw new TRPCError({code: 'FORBIDDEN', message: 'you are not the owner of this venue. Not allowed!'});
  }
  return next();
});

// TODO: Implement this middleware
// const isInCameraM = isInVenueM.unstable_pipe(({ctx, next}) => {
//   if(ctx.venue.cameras)
// })

export const currentVenueAdminP = atLeastModeratorP.use(isUserClientM).use(isVenueOwnerM);

export const userInVenueP = procedure.use(isUserClientM).use(isInVenueM);

export const clientInVenueP = procedure.use(isInVenueM);

export const isInCameraM = isUserClientM.unstable_pipe(({ctx, next}) => {
  if(!ctx.client.currentCamera){
    throw new TRPCError({code: 'PRECONDITION_FAILED', message: 'Must be inside a camera to perform that action'});
  }
  return next({
    ctx: {
      currentCamera: ctx.client.currentCamera
    }
  });
});

// TODO: Implement this procedure
// export const clientInCameraP = procedure.use(isInVenueM).use(isInCameraM);
