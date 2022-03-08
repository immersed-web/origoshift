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
  customProperties: Record<string, unknown>
  gatheringId?: string;
  roomId?: string;
  connected: boolean;
  role: UserRole,
  producers: {
    [producerId: string]: {
      producerId: string;
      kind: soup.MediaKind;
      producerInfo?: Record<string, unknown>
    }
  }
}

export interface RoomState {
  roomId: string;
  roomName?: string;
  mainProducer?: string
  // clients: string[]
  clients: {
      [clientId: string]: ClientState;
  }
  // senderClients: {
  //     [clientId: string]: ClientState;
  // }
}

export type ShallowRoomState = Omit<RoomState, 'clients'> & {clients: string[]}

export interface GatheringState {
  gatheringId: string;
  gatheringName?: string;
  // senderClients: {
  //   [clientId: string] : ClientState
  // };
  rooms: {
    [roomId: string ] : ShallowRoomState;
  }
  clients: {
      [clientId: string]: ClientState;
  }
}

// export type AllowedActions  = Extract<RequestSubjects, 'createGathering' |'joinGathering' | 'gatheringState' | 'createRoom' | 'joinRoom'>
export type AllowedAction  =  RequestSubjects | '*';
export interface UserData {
  uuid: string,
  username: string,
  role: UserRole | null, // TODO: should we really allow null here? shouldn't default just be guest?
  allowedActions: Array<AllowedAction>
}

export type UserRole = 
'guest' |
'client' |
'sender' |
'admin' |
'gunnar' 