import { securityLevels, UserRole } from "shared-types/CustomTypes";

export function throwIfUnauthorized(role: UserRole | undefined, minimumUserRole: UserRole) {
  // const userIndex = securityLevels.indexOf(role);
  // const minimumRoleIndex = securityLevels.indexOf(minimumUserRole);
  if(!role){
    throw new Error('not authorized!');
  }
  if(!minimumUserRole) {
    throw new Error('no minimum userRole provided for auth check!');
  }
  const clientSecurityLevel = securityLevels.indexOf(role);
  if(clientSecurityLevel < securityLevels.indexOf(minimumUserRole)){
    throw new Error('not authorized!');
  }
}

export function hasAtLeastSecurityLevel(role: UserRole | undefined, minimumUserRole: UserRole) {
  // const userIndex = securityLevels.indexOf(role);
  // const minimumRoleIndex = securityLevels.indexOf(minimumUserRole);
  if(!role){
    return false;
  }
  if(!minimumUserRole) {
    throw new Error('no minimum userRole provided for auth check!');
  }
  const clientSecurityLevel = securityLevels.indexOf(role);
  return clientSecurityLevel >= securityLevels.indexOf(minimumUserRole)
}