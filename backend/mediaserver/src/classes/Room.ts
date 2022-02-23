import { randomUUID } from 'crypto';
import Client from './Client';
import { RoomState } from 'shared-types/CustomTypes';
import Gathering from './Gathering';
import {types as soupTypes } from 'mediasoup';
import { createMessage } from 'shared-types/MessageTypes';
export default class Room {
  // router: soup.Router;
  id: string;
  roomName: string | undefined;
  mainProducer?: soupTypes.Producer;
  clients: Map<string, Client> = new Map();
  gathering: Gathering;
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
    this.gathering = gathering;
    this.roomName = roomName;
  }

  addClient(client: Client){
    if(this.clients.has(client.id)){
      throw Error('This client is already in the room!!');
      // console.warn('This client is already in the room!!');
      // return false;
    }
    this.clients.set(client.id, client);
    this.gathering.broadCastGatheringState();
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
      this.gathering.broadCastGatheringState([client.id]);
    }
  }

  get roomState() {
    // const clients: RoomState['clients'] = {};
    // this.clients.forEach((client, clientId) => {
    //   const nickName = client.nickName;
    //   const producers: RoomState['clients'][string]['producers'] = {};
    //   client.producers.forEach((producer, producerId) => {
    //     producers[producerId] = {
    //       producerId: producerId,
    //       kind: producer.kind,
    //     };
    //   });
    //   clients[clientId] = { 
    //     nickName,
    //     clientId,
    //     producers};
    // });
    const clients: RoomState['clients'] = [];
    this.clients.forEach(client => {
      // clients[client.id] = client.clientState;
      clients.push(client.id);
    });

    const roomInfo: RoomState = {
      roomId: this.id,
      roomName: this.roomName,
      mainProducer: this.mainProducer?.id,
      clients: clients,
    };
    return roomInfo;
  }

  // INFO: As of now we rely on the state of the gathering instead of updating each room individually. We'll see further ahead if that turns out to be a good solution
  // broadcastRoomState(clientToSkip?: Client){
  broadcastRoomState(){
    const roomState = this.roomState;
    this.clients.forEach((client) => {
      // if(clientToSkip && clientToSkip === client){
      //   return;
      // }
      // client.roomInfoUpdated(roomState);
      const msg = createMessage('roomStateUpdated', roomState);
      client.send(msg);
    });
  }
}