import { v4 as uuidv4 } from 'uuid';

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

  rooms: Map<string, Room> = new Map();

  private constructor(id?: string, name = 'unnamed'){
    if(!id){
      this.id = uuidv4();
    }else {
      this.id = id;
    }
    this.name = name;

    const alreadyExistingGathering = Gathering.gatherings.get(this.id);
    if(alreadyExistingGathering){
      console.error('already exists a gathering with that id!');
      throw new Error('cant create gathering with already taken id');
      // return;
    }

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