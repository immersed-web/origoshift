import { v4 as uuidv4 } from 'uuid';

import Room from './Room';


export default class Gathering {
  // First some static stuff for global housekeeping
  private static gatherings: Map<string, Gathering> = new Map();
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

  rooms: Map<string, Room> = new Map();

  constructor(id?: string, name = 'unnamed'){
    if(!id){
      this.id = uuidv4();
    }else {
      this.id = id;
    }
    this.name = name;


    Gathering.gatherings.set(this.id, this);
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