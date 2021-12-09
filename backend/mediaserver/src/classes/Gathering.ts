import { randomUUID } from 'crypto';
import Client from './Client';

import Room from './Room';


export default class Gathering {
  // First some static stuff for global housekeeping
  private static gatherings: Map<string, Gathering> = new Map();


  static async createGathering(id?: string, name?: string) {
    try {
      const gathering = new Gathering(id, name);
      return gathering;
    } catch (e) {
      console.error('failed to create gathering');
      throw e;       
    }
  }

  static getGathering(id: string) {
    const gathering = Gathering.gatherings.get(id);
    if(!gathering){
      console.warn('a gathering with that id doesnt exist');
      return;
    }
    return gathering;
  }

  id: string;
  name;

  private rooms: Map<string, Room> = new Map();

  private constructor(id = randomUUID(), name = 'unnamed'){
    this.id = id;
    this.name = name;

    const alreadyExistingGathering = Gathering.gatherings.get(this.id);
    if(alreadyExistingGathering){
      console.error('already exists a gathering with that id!');
      throw new Error('cant create gathering with already taken id');
      // return;
    }

    Gathering.gatherings.set(this.id, this);
  }

  addRoom(room:Room){
    this.rooms.set(room.id, room);
  }
  removeRoom(roomOrId: Room | string){
    if(typeof roomOrId === 'string'){
      this.rooms.delete(roomOrId);
      return;
    }
    this.rooms.delete(roomOrId.id);
  }

  listRooms(){
    const rooms: { roomId: string; clients: string[] }[] = [];
    this.rooms.forEach((room, key) => {
      const clientIds = room.clients.keys();
      const clientIdArray = Array.from(clientIds);
      rooms.push({roomId: room.id, clients: clientIdArray});
    });
    return rooms;
  }

  getRoom(id: string) {
    const foundRoom = this.rooms.get(id);
    if(!foundRoom){
      console.warn('the gathering doesnt have a room with that id');
      return;
    }
    return foundRoom;
    
  }
}