import { randomUUID } from 'crypto';
import Client from './Client.js';
import { RoomProperties, RoomState, ShallowRoomState, UserRole } from 'shared-types/CustomTypes';
import Gathering from './Gathering.js';
import { types as soupTypes } from 'mediasoup';
// import type { RtpParameters } from 'mediasoup/node/lib/types';
import { Request, createMessage, RequestSubjects, SuccessResponseTo } from 'shared-types/MessageTypes';
import { hasAtLeastSecurityLevel } from 'shared-modules/authUtils';
import debug from 'debug';
const roomLog = debug('Room');
const roomError = debug('Room:ERROR');
const roomWarn = debug('Room:WARNING');
export default class Room {
  // router: soup.Router;
  id: string;
  roomName: string;
  mainProducers: {
    audio?: soupTypes.Producer,
    video?: soupTypes.Producer
  } = {
      video: undefined,
      audio: undefined,
    };
  clients: Map<string, Client> = new Map();
  customProperties: RoomProperties = {};

  private gatheringId: string | undefined = undefined;
  setGathering(gatheringId: string | undefined) {
    this.gatheringId = gatheringId;
  }
  get gathering() {
    try {
      return Gathering.getGathering({ id: this.gatheringId });
    } catch (e) {
      roomError(e);
      return undefined;
    }
  }
  get producers(): ReadonlyMap<string, soupTypes.Producer> {
    const producers: Map<string, soupTypes.Producer> = new Map();
    this.clients.forEach((client) => {
      client.producers.forEach((producer) => {
        producers.set(producer.id, producer);
      });
    });
    if (this.mainProducers.video) {
      producers.set(this.mainProducers.video.id, this.mainProducers.video);
    }
    if (this.mainProducers.audio) {
      producers.set(this.mainProducers.audio.id, this.mainProducers.audio);
    }
    return producers;
  }

  static createRoom(params: { roomId?: string, roomName: string, gathering: Gathering }): Room {
    return new Room(params);
  }

  destroy() {
    this.clients.forEach(client => this.removeClient(client));
  }

  private constructor({ roomId = randomUUID(), roomName, gathering }: { roomId?: string, roomName: string, gathering: Gathering }) {
    this.id = roomId;
    this.setGathering(gathering.id);
    this.roomName = roomName;
    roomLog('Room created:', this.id);
  }

  addClient(client: Client) {
    if (this.clients.has(client.id)) {
      throw Error('This client is already in the room!!');
      // roomWarn('This client is already in the room!!');
      // return false;
    }
    this.clients.set(client.id, client);
    client.setRoom(this.id);
    // TODO; Should we perhaps only broadcast roomstate here?
    this.gathering?.broadCastGatheringState([client.id], 'client added to room');
  }

  removeClient(clientOrId: Client | string, skipBroadcast = false) {
    let client: Client;
    if (!(clientOrId instanceof Client)) {
      const foundClient = this.clients.get(clientOrId);
      if (!foundClient) {
        throw Error('no client with that id in room!');
      }
      client = foundClient;

    } else {
      client = clientOrId;
    }
    if (!client.id) {
      // roomWarn('invalid client object provided when trying to remove client from room. id missing!');
      // return false;
      throw new Error('invalid client object provided when trying to remove client from room. id missing!');
    }
    const isInDictionary = this.clients.has(client.id);
    if (!isInDictionary) {
      roomWarn('client is NOT in the room, Cant remove client from the room');
      return;
    }
    if (this.mainProducers.audio || this.mainProducers.video) {
      roomLog('HAS MAINPRODUCER!!!!');
      if (this.mainProducers.video) {
        if (client.producers.has(this.mainProducers.video.id)) {
          roomLog('removed client was also video mainProducer. Will remove it as well from the room');
          this.mainProducers.video = undefined;
        }
      }
      if (this.mainProducers.audio) {
        if (client.producers.has(this.mainProducers.audio.id)) {
          roomLog('removed client was also audio mainProducer. Will remove it as well from the room');
          this.mainProducers.audio = undefined;
        }
      }
    }
    delete client.customProperties.forceMuted;
    const ok = this.clients.delete(client.id);
    if (!ok) {
      throw new Error(`failed to remove client ${client.id} from room`);
    }
    client.setRoom(undefined); // Be aware. I've now decided to let the room be responsible for clearing the clients room-field.
    if (this.clients.size == 0) {
      roomLog('last client left the room. will also remove the room itself');
      this.gathering?.deleteRoom(this);
    }
    if (!skipBroadcast) {
      this.gathering?.broadCastGatheringState([client.id], 'client removed from room');
    }
  }

  setCustomProperties(props: RoomProperties) {

    for (const [key, prop] of Object.entries(props)) {
      this.customProperties[key] = prop;
    }
    this.gathering?.broadCastGatheringState(undefined, 'added/set custom properties for room');
  }

  get roomState(): RoomState {
    const clients: RoomState['clients'] = {};
    this.clients.forEach(client => {
      clients[client.id] = client.clientState;
      // clients.push(client.id);
    });

    const roomInfo: RoomState = {
      roomId: this.id,
      roomName: this.roomName,
      customProperties: this.customProperties,
      mainProducers: {
        video: this.mainProducers.video?.id,
        audio: this.mainProducers.audio?.id,
      },
      clients,
    };
    return roomInfo;
  }

  get shallowRoomState(): ShallowRoomState {
    return { ...this.roomState, clients: Array.from(this.clients.keys()) };
  }

  async broadcastRequest<T extends RequestSubjects>(request: Request<T>, minimumRoleForReceivers?: UserRole, timeoutMillis?: number): Promise<SuccessResponseTo<T>> {
    const promises: Promise<SuccessResponseTo<T>>[] = [];
    this.clients.forEach(client => {
      if (!minimumRoleForReceivers || hasAtLeastSecurityLevel(client.role, minimumRoleForReceivers)) {
        const promise = client.sendRequest(request, timeoutMillis);
        promises.push(promise);
      }
    });
    return Promise.race(promises);
  }

  broadcastRoomState(reason?: string) {
    let updateReason = 'reason not specified';
    if (reason) updateReason = reason;
    // const gatheringState = this.gathering.gatheringState;
    this.clients.forEach((client) => {
      // const msg = createMessage('gatheringStateUpdated', gatheringState);
      // client.send(msg);
      const msg = createMessage('roomStateUpdated', { newState: this.roomState, reason: updateReason });
      client.send(msg);
    });
  }
}
