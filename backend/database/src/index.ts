export * from '@prisma/client'
import { Prisma } from '@prisma/client'


const gatheringWithRoomsAndUsers = Prisma.validator<Prisma.GatheringArgs>()({
  include: { rooms: true, users: true },
});
export type GatheringWithRoomsAndUsers = Prisma.GatheringGetPayload<typeof gatheringWithRoomsAndUsers>;

const userWithIncludes = Prisma.validator<Prisma.UserArgs>()({
  include: {
    gathering: true,
    role: true,
  },
});

export type UserWithIncludes = Prisma.UserGetPayload<typeof userWithIncludes>;
