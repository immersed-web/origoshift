import { randomUUID } from 'crypto';
import Client from './Client';
import { RoomState, ShallowRoomState } from 'shared-types/CustomTypes';
import Gathering from './Gathering';
import {types as soupTypes } from 'mediasoup';
import { createMessage } from 'shared-types/MessageTypes';
import debug from 'debug';
const roomLog = debug('Room');
const roomError = debug('Room:ERROR');
const roomWarn = debug('Room:WARNING');
export default class Room {
  // router: soup.Router;
  id: string;
  roomName: string | undefined;
  mainProducer?: soupTypes.Producer;
  clients: Map<string, Client> = new Map();

  private gatheringId: string | undefined = undefined;
  setGathering(gatheringId: string | undefined){
    this.gatheringId = gatheringId;
  }
  get gathering() {
    try{
      return Gathering.getGathering({id: this.gatheringId });
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
    if(this.mainProducer){
      producers.set(this.mainProducer.id, this.mainProducer);
    }
    return producers;
  }

  static createRoom(params: {roomId?: string, roomName?: string, gathering: Gathering}): Room {
    return new Room(params);
  }

  destroy() {
    this.clients.forEach(client => this.removeClient(client));
  }

  private constructor({roomId = randomUUID(), roomName, gathering}: {roomId?: string, roomName?: string, gathering: Gathering}) {
    this.id = roomId;
    this.setGathering(gathering.id);
    this.roomName = roomName;
    roomLog('Room created:', this.id);
  }

  addClient(client: Client){
    if(this.clients.has(client.id)){
      throw Error('This client is already in the room!!');
      // roomWarn('This client is already in the room!!');
      // return false;
    }
    // TODO; Should we perhaps only broadcast roomstate here?
    this.clients.set(client.id, client);
    this.gathering?.broadCastGatheringState([client.id]);
  }

  removeClient(client: Client, skipBroadcast = false ){
    if(!client.id){
      // roomWarn('invalid client object provided when trying to remove client from room. id missing!');
      // return false;
      throw new Error('invalid client object provided when trying to remove client from room. id missing!');
    }
    const isInDictionary = this.clients.has(client.id);
    if(!isInDictionary){
      roomWarn('client is NOT in the room, Cant remove client from the room');
      return;
    }
    if(this.mainProducer){
      roomLog('HAS MAINPRODUCER!!!!');
      if(client.producers.has(this.mainProducer.id)){
        roomLog('removed client was also mainProducer. Will remove it as well from the room');
        this.mainProducer = undefined;
      }
    }
    const ok = this.clients.delete(client.id);
    if(!ok){
      throw new Error(`failed to remove client ${client.id} from room`);
    }
    if(!skipBroadcast){
      this.gathering?.broadCastGatheringState([client.id]);
    }
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
      mainProducer: this.mainProducer?.id,
      clients,
    };
    return roomInfo;
  }

  get shallowRoomState (): ShallowRoomState {
    return {...this.roomState, clients: Array.from(this.clients.keys())};
  }

  // broadcastRoomState(clientToSkip?: Client){
  broadcastRoomState(reason?: string){
    let updateReason = 'reason not specified';
    if(reason) updateReason = reason;
    // const gatheringState = this.gathering.gatheringState;
    this.clients.forEach((client) => {
      // const msg = createMessage('gatheringStateUpdated', gatheringState);
      // client.send(msg);
      const msg = createMessage('roomStateUpdated',{newState: this.roomState, reason: updateReason});
      client.send(msg);
    });
  }
}