
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


export function valueIsAlreadyTaken(value: string, takenValues: string[]){
  // if(takenValues instanceof Map){
  //   takenValues.forEach(takenValue => {
  //     if(propName){
  //       if(takenValue[propName] === value){
  //         return true;
  //       }
  //     }
  //   });
  // } else {
  takenValues.forEach(stringValue => {
    if(stringValue === value){
      return true;
    }
  });
  // }
  return false;
}