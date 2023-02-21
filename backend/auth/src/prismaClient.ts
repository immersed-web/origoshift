import { PrismaClient, Prisma, User } from 'database';
import { UserRole, JwtUserData, UserIdSchema } from 'schemas';

const prisma = new PrismaClient();

// This is not optimal. We actually want an SQL query that excludes stuff. This merely removes the data in js land afterwards
// See: https://github.com/prisma/prisma/issues/5042
// And possibly cleaner (yet hacky) solution than the one below: https://github.com/prisma/prisma/issues/5042#issuecomment-1383213516
// Another possible solution is using "Prisma Client Extensions"
export function exclude<User, Key extends keyof User>(
  user: User,
  ...keys: Key[]
): Omit<User, Key> {
  for (const key of keys) {
    delete user[key];
  }
  return user;
}

// type Includes = {
//   [Property in keyof Pick<Required<Prisma.UserInclude>, 'gathering' | 'role'>]: true
// }
// const includes: Includes = {
//   gathering: true,
//   role: true,
// };

// const userWithIncludes = Prisma.validator<Prisma.UserArgs>()({
//   include: includes
// });

// type UserWithIncludes = Prisma.UserGetPayload<typeof userWithIncludes>
// type UserQueryWithIncludes = Prisma.UserFindUniqueArgs & {include: typeof includes };

export const users = Object.assign(prisma.user, {

  userResponseToUserData(user: User){
    const {userId, role, username } = user;
    const userData: JwtUserData = {
      username,
      role,
      userId: UserIdSchema.parse(userId),
      // gathering: user.gathering?.name,
      // allowedRooms: rooms,
      // allowedActions: allowedActions,
    };
    return userData;
  },

  async findUserAsUserData(query: Prisma.UserFindUniqueArgs): Promise<JwtUserData> {
    // const includes: Includes = {gathering: true, role: true, rooms: true};
    // const userFind = {...query};
    const foundUser = await prisma.user.findUnique(query);
    // const foundUser = await prisma.user.findUnique({where:{username: 'admin'}, include: { role: true, gathering: true, rooms: true}});

    if (!foundUser) {
      throw new Error('no user with that username found');
    }


    return this.userResponseToUserData(foundUser);
  }
});

export default prisma;

export { Prisma };
