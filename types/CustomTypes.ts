export interface RoomState {
  producers: Record<string, unknown>[],
  consumers: Record<string, unknown>[],
  clients: Record<string, unknown>[],
}

export interface RoomInfo {
  roomId: string;
  clients: Record<string, {
    clientId: string,
    producers: string[]
  }>
}

export interface UserData {
  uuid: string,
  username: string,
  role: UserRole | null,
}

export type UserRole = 
'anonymous' |
'user' |
'admin' |
'gunnar' 