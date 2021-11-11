import { v4 as uuidv4 } from 'uuid';

import Room from './Room';


export default class Gathering {
  // First some static stuff for global housekeeping
  static gatherings: Map<string, Gathering> = new Map();

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
}