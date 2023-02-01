export * from '@prisma/client'
// import { Prisma, PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient();
// prisma.$use(async (params, next) =>{
//   //before query
//   const result = await next(params);
//   return result;
// });


// const gatheringWithRoomsAndUsers = Prisma.validator<Prisma.GatheringArgs>()({
//   include: { rooms: true, users: true },
// });
// export type GatheringWithRoomsAndUsers = Prisma.GatheringGetPayload<typeof gatheringWithRoomsAndUsers>;

// const userWithIncludes = Prisma.validator<Prisma.UserArgs>()({
//   include: {
//     gathering: true,
//     role: true,
//   },
// });

// export type UserWithIncludes = Prisma.UserGetPayload<typeof userWithIncludes>;
