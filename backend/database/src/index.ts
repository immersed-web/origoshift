import { Prisma } from '@prisma/client'

export * from '@prisma/client'


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
