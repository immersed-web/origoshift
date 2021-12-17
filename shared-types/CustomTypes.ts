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