// export interface RoomState {
//   producers: Record<string, unknown>[],
//   consumers: Record<string, unknown>[],
//   clients: Record<string, unknown>[],
// }
import {types as soup} from 'mediasoup';
import { RequestSubjects } from './MessageTypes';

export interface ClientState {
  clientId: string;
  username?: string;
  gatheringId?: string;
  roomId?: string;
  connected: boolean;
  role: UserRole,
  producers: {
    [producerId: string]: {
      producerId: string;
      kind: soup.MediaKind;
    }
  }
}

export interface RoomState {
  roomId: string;
  roomName?: string;
  clients: {
      [clientId: string]: ClientState;
      // {
      // clientId: string;
      // nickName?: string;
      // producers:  {
      //   [producerId: string]: {
      //     producerId: string;
      //     kind: soup.MediaKind;
      //   }
      // }
  }
}

export interface GatheringState {
  gatheringId: string;
  gatheringName?: string;
  senderClients: {
    [clientId: string] : ClientState
  };
  rooms: {
    [roomId: string ] : RoomState;
  }
}

// export type AllowedActions  = Extract<RequestSubjects, 'createGathering' |'joinGathering' | 'gatheringState' | 'createRoom' | 'joinRoom'>
export type AllowedAction  = RequestSubjects | '*';
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