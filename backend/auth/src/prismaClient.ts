import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const userWithRole = Prisma.validator<Prisma.UserArgs>()({include: {role: true}});
type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>
    
export default prisma;

export {Prisma};

export type {UserWithRole};