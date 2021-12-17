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
    this.broadcastRoomInfo();

    return true;
  }

  removeClient(client: Client){
    if(!client.id){
      console.warn('invalid client object provided when trying to remove client from room. id missing!');
      return false;
    }
    const ok = this.clients.delete(client.id);
    this.broadcastRoomInfo();
    return ok;
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

  broadcastRoomInfo(clientToSkip?: Client){
    const roomState = this.getRoomState();
    this.clients.forEach((client) => {
      if(clientToSkip && clientToSkip === client){
        return;
      }
      client.roomInfoUpdated(roomState);
    });
  }
}