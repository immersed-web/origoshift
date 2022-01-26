// export interface RoomState {
//   producers: Record<string, unknown>[],
//   consumers: Record<string, unknown>[],
//   clients: Record<string, unknown>[],
// }
import {types as soup} from 'mediasoup';
import { RequestSubjects } from './MessageTypes';

export interface ClientState {
  gatheringId?: string;
  roomId?: string;
}

export interface RoomState {
  roomId: string;
  roomName?: string;
  clients: {
      [clientId: string]: {
      clientId: string;
      nickName?: string;
      producers:  {
        [producerId: string]: {
          producerId: string;
          kind: soup.MediaKind;
        }
      }
    }
  }
}

export interface GatheringState {
  gatheringId: string;
  gatheringName?: string;
  rooms: {
    [roomId: string ] : RoomState;
  }
}

// export type AllowedActions  = Extract<RequestSubjects, 'createGathering' |'joinGathering' | 'gatheringState' | 'createRoom' | 'joinRoom'>
export type AllowedAction  = RequestSubjects;
export interface UserData {
  uuid: string,
  username: string,
  role: UserRole | null, // TODO: should we really allow null here? shouldn't default just be guest?
  allowedActions: Array<AllowedAction>
}

export type UserRole = 
'guest' |
'user' |
'admin' |
'gunnar' 