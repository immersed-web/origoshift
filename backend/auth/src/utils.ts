import { UserWithRole } from './prismaClient';
import { UserData, UserRole } from 'shared-types/CustomTypes';
export const userDataFromDBResponse = (userWithRole: UserWithRole): UserData => {
  // console.log('transforming db response to userObject!');
  let role: string | null = null;
  if(userWithRole.role?.role){
    role = userWithRole.role.role;
  }
  return {
    uuid: userWithRole.uuid,
    username: userWithRole.username,
    role: role as UserRole,
    // TODO: Actually retrieve this data!!!!!
    allowedActions: ['joinGathering', 'joinRoom']
  };
};