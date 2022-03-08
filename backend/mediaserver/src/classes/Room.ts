import { randomUUID } from 'crypto';
import Client from './Client';
import { RoomState, ShallowRoomState } from 'shared-types/CustomTypes';
import Gathering from './Gathering';
import {types as soupTypes } from 'mediasoup';
import { createMessage } from 'shared-types/MessageTypes';
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
      console.error(e);
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
    const createdRoom = new Room(params);
    return createdRoom;
  }

  private constructor({roomId = randomUUID(), roomName, gathering}: {roomId?: string, roomName?: string, gathering: Gathering}) {
    this.id = roomId;
    this.setGathering(gathering.id);
    this.roomName = roomName;
  }

  addClient(client: Client){
    if(this.clients.has(client.id)){
      throw Error('This client is already in the room!!');
      // console.warn('This client is already in the room!!');
      // return false;
    }
    // TODO; Should we perhaps only broadcast roomstate here?
    this.clients.set(client.id, client);
    this.gathering?.broadCastGatheringState([client.id]);
  }

  removeClient(client: Client, skipBroadcast = false ){
    if(!client.id){
      // console.warn('invalid client object provided when trying to remove client from room. id missing!');
      // return false;
      throw new Error('invalid client object provided when trying to remove client from room. id missing!');
    }
    const isInDictionary = this.clients.has(client.id);
    if(!isInDictionary){
      console.warn('client is NOT in the room, Cant remove client from the room');
      return;
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

  // INFO: As of now we rely on the state of the gathering instead of updating each room individually. We'll see further ahead if that turns out to be a good solution
  // broadcastRoomState(clientToSkip?: Client){
  broadcastRoomState(){
    // const gatheringState = this.gathering.gatheringState;
    this.clients.forEach((client) => {
      // const msg = createMessage('gatheringStateUpdated', gatheringState);
      // client.send(msg);
      const msg = createMessage('roomStateUpdated', this.roomState);
      client.send(msg);
    });
  }
}