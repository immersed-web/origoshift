import { randomUUID } from 'crypto';
import Client from './Client';
import { RoomState } from 'shared-types/CustomTypes';
import Gathering from './Gathering';
export default class Room {
  // router: soup.Router;
  id: string;
  clients: Map<string, Client> = new Map();
  gathering: Gathering;

  static createRoom(id: string = randomUUID(), gathering: Gathering): Room {
    const createdRoom = new Room(id, gathering);
    return createdRoom;
  }

  private constructor(id: string, gathering: Gathering) {
    this.id = id;
    this.gathering = gathering;
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
      this.gathering.broadCastGatheringState();
    }
  }

  getRoomState() {
    const clients: RoomState['clients'] = {};
    this.clients.forEach((client, clientId) => {
      const nickName = client.nickName;
      const producers: RoomState['clients'][string]['producers'] = {};
      client.producers.forEach((producer, producerId) => {
        producers[producerId] = {
          producerId: producerId,
          kind: producer.kind,
        };
      });
      clients[clientId] = { 
        nickName,
        clientId,
        producers};
    });

    const roomInfo: RoomState = {
      roomId: this.id,
      clients: clients,
    };
    return roomInfo;
  }

  // INFO: As of now we rely on the state of the gathering instead of updating each room individually. We'll see further ahead if that turns out to be a good solution
  // broadcastRoomInfo(clientToSkip?: Client){
  //   const roomState = this.getRoomState();
  //   this.clients.forEach((client) => {
  //     if(clientToSkip && clientToSkip === client){
  //       return;
  //     }
  //     client.roomInfoUpdated(roomState);
  //   });
  // }
}