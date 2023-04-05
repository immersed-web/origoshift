import { Prisma } from '@prisma/client'

export * from '@prisma/client'

// TODO: We really would like to use this but faaacking zod once again complains about infer not being found... Sigh
// export * from './zod';


export const userSelectAll = {
  userId: true,
  username: true,
  role: true,
  updatedAt: true,
  ownedVenues: true,
  allowedVenues: true,
  bannedVenues: true,
  password: true,
} satisfies Prisma.UserSelect;

export const userDeselectPassword = {
  // userId: true,
  // username: true,
  // role: true,
  // updatedAt: true,
  // ownedVenues: true,
  // allowedVenues: true,
  // bannedVenues: true,
  password: false,
} satisfies Prisma.UserSelect;
