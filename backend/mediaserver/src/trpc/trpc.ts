import { initTRPC } from '@trpc/server';
import { JwtUserData } from 'schemas';

const trpc = initTRPC.context<JwtUserData>().create();

export const middleware = trpc.middleware;
export const router = trpc.router;
export const procedure = trpc.procedure;
