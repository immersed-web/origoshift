// export interface RoomState {
//   producers: Record<string, unknown>[],
//   consumers: Record<string, unknown>[],
//   clients: Record<string, unknown>[],
// }
import { types as soup } from 'mediasoup';
import { UserRole } from 'schemas';
import { RequestSubjects } from './MessageTypes.js';

export interface ProducerInfo {
  paused: boolean,
  screenShare?: boolean,
  forceMuted?: boolean,
  dimensions?: { w: number, h: number },
  [key: string]: unknown
}

export interface ClientProperties {
  handRaised?: boolean,
  forceMuted?: boolean,
  [key: string]: unknown,
}

export interface RoomProperties {
  doorIsOpen?: boolean,
  [key: string]: unknown,
}

export interface ClientState {
  clientId: string;
  username?: string;
  customProperties: ClientProperties
  gatheringId?: string;
  roomId?: string;
  connected: boolean;
  role: UserRole,
  producers: {
    [producerId: string]: {
      producerId: string;
      kind: soup.MediaKind;
      // producerInfo?: Record<string, unknown>
      producerInfo?: ProducerInfo
    }
  }
}

export interface RoomState {
  roomId: string;
  roomName?: string;
  customProperties: RoomProperties,
  mainProducers: {
    video?: string,
    audio?: string,
  },
  // clients: string[]
  clients: {
    [clientId: string]: ClientState;
  }
  // senderClients: {
  //     [clientId: string]: ClientState;
  // }
}

export type ShallowRoomState = Omit<RoomState, 'clients'> & { clients: string[] }

export interface GatheringState {
  gatheringId: string;
  gatheringName?: string;
  // senderClients: {
  //   [clientId: string] : ClientState
  // };
  rooms: {
    [roomId: string]: ShallowRoomState;
  }
  clients: {
    [clientId: string]: ClientState;
  }
}

// export type AllowedActions  = Extract<RequestSubjects, 'createGathering' |'joinGathering' | 'gatheringState' | 'createRoom' | 'joinRoom'>
export type AllowedAction = RequestSubjects | '*';
// export interface UserData {
//   uuid: string,
//   username: string,
//   role: UserRole,
//   gathering?: '*' | string
//   // allowedRooms?: '*' | string[]
//   // allowedActions: Array<AllowedAction>
// }

// export const securityLevels = [
//   'guest',
//   'client',
//   // 'sender',
//   'host',
//   'admin',
//   'gunnar'
// ] as const;

// export type UserRole = (typeof securityLevels)[number];
// export type NonGuestUserRole = Exclude<(typeof securityLevels)[number], 'guest'>;


// function makeDefaultAction<T extends AllowedAction[]>(t: T): T {
//   return t;
// }

// const defaultActions = makeDefaultAction([
//   'connectTransport',
//   'createReceiveTransport',
//   'createConsumer',
//   'getRouterRtpCapabilities',
//   'setRtpCapabilities',
//   'notifyCloseEventRequest',
//   'notifyPauseResumeRequest',
//   'joinRoom',
//   'requestToJoinRoom',
//   'leaveRoom',
//   'findRoomByName',
//   'joinGathering',
//   'leaveGathering',
//   'findGatheringByName',
//   'setName',
//   'getClientState',
//   'setCustomClientProperties',
//   'createGathering',
//   'createProducer',
//   'createSendTransport',
// ]);


// type DefaultAction = (typeof defaultActions)[number];
// type NonDefaultAction = Exclude<AllowedAction, DefaultAction>

// const hostActions: NonDefaultAction[] = [
//   'assignMainProducerToRoom', 'createRoom', 'setRoomName', 'customRequest', 'getGatheringState', 'removeClientFromRoom', 'closeAllProducersForClient', 'pauseAllProducersForClient', 'setForceMuteStateForProducer', 'setForceMuteStateForClient', 'setCustomRoomProperties',
// ]

export const allowedActions: Record<UserRole, AllowedAction[]> = {
  gunnar: ['*'],
  superadmin: ['*'],
  admin: ['*'],
  moderator: ['*'],
  user: ['*'],
  guest: ['*'],
}
