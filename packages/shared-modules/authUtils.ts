import { UserRole, roleHierarchy } from "schemas";

// export function throwIfUnauthorized(role: UserRole | undefined, minimumUserRole: UserRole) {
//   // const userIndex = securityLevels.indexOf(role);
//   // const minimumRoleIndex = securityLevels.indexOf(minimumUserRole);
//   if(!role){
//     throw new Error('not authorized!');
//   }
//   if(!minimumUserRole) {
//     throw new Error('no minimum userRole provided for auth check!');
//   }
//   const clientSecurityLevel = roleHierarchy.indexOf(role);
//   if(clientSecurityLevel < roleHierarchy.indexOf(minimumUserRole)){
//     throw new Error('not authorized!');
//   }
// }

// export function hasAtLeastSecurityLevel(role: UserRole | undefined, minimumUserRole: UserRole) {
//   // const userIndex = securityLevels.indexOf(role);
//   // const minimumRoleIndex = securityLevels.indexOf(minimumUserRole);
//   if(!role){
//     return false;
//   }
//   if(!minimumUserRole) {
//     throw new Error('no minimum userRole provided for auth check!');
//   }
//   const clientSecurityLevel = roleHierarchy.indexOf(role);
//   return clientSecurityLevel >= roleHierarchy.indexOf(minimumUserRole)
// }
