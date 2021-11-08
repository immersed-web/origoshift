import { v4 as uuidv4 } from 'uuid';

import Room from './Room';


export default class Event {
  id: string;

  rooms: Room[] = [];

  constructor(id?: string){
    if(!id){
      this.id = uuidv4();
    }else {
      this.id = id;
    }
  }
}