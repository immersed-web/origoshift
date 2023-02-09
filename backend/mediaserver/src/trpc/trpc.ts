import { initTRPC, TRPCError } from '@trpc/server';
import { JwtUserData, hasAtLeastSecurityLevel } from 'schemas';
import type { Context } from 'index';

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
