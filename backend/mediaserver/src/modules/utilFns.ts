import { UserRole } from 'schemas';

// export function checkPermission(role: UserRole, action: AllowedAction) {
//   if(!role){
//     return false;
//   }
//   if(!allowedActions[role]){
//     throw new Error('provide role not found in roleList');
//   }
//   if(allowedActions[role].includes('*')){
//     return true;
//   }
//   return allowedActions[role].includes(action);
// }


// export function valueIsAlreadyTaken(value: string, takenValues: string[]){
//   // if(takenValues instanceof Map){
//   //   takenValues.forEach(takenValue => {
//   //     if(propName){
//   //       if(takenValue[propName] === value){
//   //         return true;
//   //       }
//   //     }
//   //   });
//   // } else {
//   takenValues.forEach(stringValue => {
//     if(stringValue === value){
//       return true;
//     }
//   });
//   // }
//   return false;
// }
