import { randomUUID } from 'crypto';
import Client from './Client';
import { RoomState } from 'shared-types/CustomTypes';
export default class Room {
  // router: soup.Router;
  id: string;
  clients: Map<string, Client> = new Map();

  static async createRoom(id: string = randomUUID()): Promise<Room> {
    const createdRoom = new Room(id);
    return createdRoom;
  }

  private constructor(id: string) {
    this.id = id;
  }

  addClient(client: Client){
    if(this.clients.has(client.id)){
      console.warn('This client is already in the room!!');
      return false;
    }
    this.clients.set(client.id, client);
    this.broadcastRoomState();

    return true;
  }

  removeClient(client: Client){
    if(!client.id){
      console.warn('invalid client object provided when trying to remove client from room. id missing!');
      return false;
    }
    const ok = this.clients.delete(client.id);
    this.broadcastRoomState();
    return ok;
  }

  private createRoomStateObj() {
    const roomState: RoomState = {};
    this.clients.forEach((client, clientId) => {
      const nickName = client.nickName;
      const producersArray = Array.from(client.producers.values());
      const producers = producersArray.map((producer) => {
        return {
          producerId: producer.id,
          kind: producer.kind,
        };
      });
      // const producers = Array.from(client.producers.keys());
      roomState[clientId] = {
        nickName,
        producers
      };
    });
    return roomState;
  }

  broadcastRoomState(clientToSkip?: Client){
    const roomState = this.createRoomStateObj();
    this.clients.forEach((client) => {
      if(clientToSkip && clientToSkip === client){
        return;
      }
      client.roomStateUpdated(roomState);
    });
  }
}