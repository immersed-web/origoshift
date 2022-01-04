// export interface RoomState {
//   producers: Record<string, unknown>[],
//   consumers: Record<string, unknown>[],
//   clients: Record<string, unknown>[],
// }
import {types as soup} from 'mediasoup';

export interface RoomState {
  roomId: string;
  clients: {
      [client : string]: {
      clientId: string,
      nickName?: string;
      producers:  {
        [producerId: string]: {
          producerId: string,
          kind: soup.MediaKind
        }
      }
    }
  }
}

export type AllowedActions = 'createGathering' |'joinGathering' | 'getRoomsInGathering' | 'createRoom' | 'joinRoom'
export interface UserData {
  uuid: string,
  username: string,
  role: UserRole | null, // TODO: should we really allow null here? shouldn't default just be guest?
  allowedActions: Array<AllowedActions>
}

export type UserRole = 
'guest' |
'user' |
'admin' |
'gunnar' 