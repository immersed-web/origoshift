import { UserWithRole } from './prismaClient';
import { UserData, UserRole, AllowedAction } from 'shared-types/CustomTypes';
export const userDataFromDBResponse = (userWithRole: UserWithRole): UserData => {
  // console.log('transforming db response to userObject!');
  let role: UserRole | null = null;
  if(userWithRole.role?.role){
    role = userWithRole.role.role as UserRole;
  }
  // TODO: We really need to clean this db shit up!!!!
  const clientActions: AllowedAction[] = ['setRtpCapabilities', 'setName', 'getRouterRtpCapabilities', 'joinGathering', 'joinRoom', 'leaveGathering', 'leaveRoom', 'notifyCloseEvent', 'notifyPauseResume','createReceiveTransport', 'connectTransport', 'createConsumer'];
  const adminActions: AllowedAction[]  = ['*', 'joinGatheringAsSender', ...clientActions];

  const allowedActions = role == 'admin'? adminActions : clientActions; 
  return {
    uuid: userWithRole.uuid,
    username: userWithRole.username,
    role: role,
    // TODO: Actually retrieve this data!!!!!
    allowedActions: allowedActions,
  };
};