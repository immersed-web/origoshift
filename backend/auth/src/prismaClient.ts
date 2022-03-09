import { PrismaClient, Prisma } from '@prisma/client';
import { UserData } from 'shared-types/CustomTypes';

const prisma = new PrismaClient();

const userWithRole = Prisma.validator<Prisma.UserArgs>()({include: {role: true}});
type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>


  

function Users(prismaUser: PrismaClient['user']){
  return Object.assign( prisma, {
    async getUserData(username: string): UserData {
      const foundUser = prismaUser.findUnique({
        where: {
          username: username,
        },
        include: {
          role: true,
          gathering: true,
          rooms: true,
        }
      })

      return {
        username: foundUser.
      }
    }
  })
}

export const userDataFromDBResponse = (userWithRole: UserWithRole): UserData => {
  // console.log('transforming db response to userObject!');
  let role: UserRole | null = null;
  if(userWithRole.role?.role){
    role = userWithRole.role.role as UserRole;
  }

  // TODO: We really need to clean this db shit up!!!!
  const clientActions: AllowedAction[] = ['setRtpCapabilities', 'setName', 'getRouterRtpCapabilities', 'joinGathering', 'joinRoom', 'leaveGathering', 'leaveRoom', 'notifyCloseEvent', 'notifyPauseResume','createReceiveTransport', 'connectTransport', 'createConsumer', 'findGatheringByName'];
  const adminActions: AllowedAction[]  = ['*', 'joinGatheringAsSender', ...clientActions];

  const allowedActions = role == 'admin'? adminActions : clientActions; 
  return {
    uuid: userWithRole.uuid,
    username: userWithRole.username,
    role: role,
    // TODO: Actually retrieve this data!!!!!
    allowedActions: allowedActions,
    allowedGatherings:
  };
};






    
export default prisma;

export {Prisma};

export type {UserWithRole};