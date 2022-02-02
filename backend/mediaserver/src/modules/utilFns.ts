
import { UserData } from 'shared-types/CustomTypes';

export function checkPermission(userData: UserData | undefined, action: UserData['allowedActions'][number]) {
  if(!userData){
    return false;
  }
  const actions = userData.allowedActions;
  if(actions.includes('*')){
    return true;
  }
  return actions.includes(action);
}