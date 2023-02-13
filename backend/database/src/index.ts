export * from '@prisma/client'
// import { Prisma } from '@prisma/client'

// const prisma = new PrismaClient();
// prisma.$use(async (params, next) =>{
//   //before query
//   const result = await next(params);
//   return result;
// });

// export type GatheringWithRoomsAndUsers = Prisma.GatheringGetPayload<typeof gatheringWithRoomsAndUsers>;

// const userWithIncludes = Prisma.validator<Prisma.UserArgs>()({
//   include: {
//     gathering: true,
//     role: true,
//   },
// });

// export type UserWithIncludes = Prisma.UserGetPayload<typeof userWithIncludes>;
