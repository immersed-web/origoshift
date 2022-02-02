import { randomUUID } from 'crypto';
import { GatheringState } from 'shared-types/CustomTypes';
import { createMessage } from 'shared-types/MessageTypes';
import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';
// import Client from './Client';
import {types as soup} from 'mediasoup';

import Room from './Room';
import Client from './Client';


export default class Gathering {
  // First some static stuff for global housekeeping
  private static gatherings: Map<string, Gathering> = new Map();

  static async createGathering(id?: string, name?: string, worker?: soup.Worker) {
    try {
      const routerOptions: soup.RouterOptions = {};
      if(mediasoupConfig.router.mediaCodecs){
        routerOptions.mediaCodecs = mediasoupConfig.router.mediaCodecs;
      }
      if(!worker){
        worker = getMediasoupWorker();
      }
      const router = await worker.createRouter(routerOptions);
      const gathering = new Gathering(id, name, router);
      return gathering;
    } catch (e) {
      console.error('failed to create gathering');
      throw e;       
    }
  }

  static getGathering(params:{id?: string, name?:string}) {
    if(params.id){

      const gathering = Gathering.gatherings.get(params.id);
      if(!gathering){
        throw new Error('a gathering with that id doesnt exist');
      }
      return gathering;
    }else if(params.name){
      return this.getGatheringFromName(params.name);
    } else {
      throw new Error('no id or name provided. Cant get gathering! Duuuh!');
    }
  }

  private static getGatheringFromName(name:string): Gathering {
    console.log('searching gathering with name:',name);
    for (const [key, gathering] of Gathering.gatherings) {
      console.log('checking gathering:', gathering);
      if(gathering.name === name){
        return gathering;
      }
    }
    throw new Error('couldnt find a gathering with that name!!! You fuckhead!');
  }


  id: string;
  name;
  router: soup.Router;

  private rooms: Map<string, Room> = new Map();

  // TODO: perhaps make this a getter. Then we wouldn't need as much housekeeping for maintaining sync between clients in rooms and clients in gathering.
  // It would involve looking up all clients in every room in this gathering as a getter function
  private clients: Map<string, Client> = new Map();

  private constructor(id = randomUUID(), name = 'unnamed', router: soup.Router){
    this.id = id;
    this.name = name;
    this.router = router;

    const alreadyExistingGathering = Gathering.gatherings.get(this.id);
    if(alreadyExistingGathering){
      console.error('already exists a gathering with that id!');
      throw new Error('cant create gathering with already taken id');
      // return;
    }

    Gathering.gatherings.set(this.id, this);
  }

  addClient ( client : Client){
    this.clients.set(client.id, client);
    // We dont broadcast when a client joins. Broadcast is only relevant when they actually join a room
    this.sendGatheringStateTo(client);
  }

  removeClient (client: Client) {
    this.clients.delete(client.id);
  }

  getRtpCapabilities(): soup.RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  createRoom({roomId, roomName}: {roomId?: string, roomName?: string}){
    const room = Room.createRoom({roomId, roomName, gathering: this});
    this.rooms.set(room.id, room);
    this.broadCastGatheringState();

    return room;
  }

  sendGatheringStateTo(client: Client){
    const state = this.getGatheringState();
    const msg = createMessage('gatheringStateUpdated', state);
    client.send(msg);
  }

  broadCastGatheringState(clientsToSkip: string[] = []) {
    const gatheringState = this.getGatheringState();
    console.log(`gonna broadcast to ${this.clients.size} clients`);

    this.clients.forEach((client) => {
      if(client.id in clientsToSkip){
        console.log('skipping client:', client.id);
        return;
      }
      const gatheringRoomsMsg = createMessage('gatheringStateUpdated', gatheringState);
      console.log(`sending gatheringStateUpdated to client ${client.id}`);
      client.send(gatheringRoomsMsg);
    });
    // });
  }

  // TODO: will this truly suffice for deleting the room? Or will it float around as a deserted little vessel in the memory ocean?
  deleteRoom(roomOrId: Room | string){
    if(typeof roomOrId === 'string'){
      this.rooms.delete(roomOrId);
      return;
    }
    this.rooms.delete(roomOrId.id);
  }

  getGatheringState() {
    const gatheringState: GatheringState = { gatheringId: this.id, rooms: {} };
    if(this.name){
      gatheringState.gatheringName = this.name;
    }
    this.rooms.forEach((room) => {
      const roomstate = room.getRoomState();
      gatheringState.rooms[room.id] = roomstate;
    });
    return gatheringState;
  }

  getRoom(id: string) {
    const foundRoom = this.rooms.get(id);
    if(!foundRoom){
      console.warn('the gathering doesnt have a room with that id');
      return;
    }
    return foundRoom;
    
  }

  async createWebRtcTransport() {
    const { listenIps, enableUdp, enableTcp, preferUdp, initialAvailableOutgoingBitrate } = mediasoupConfig.webRtcTransport;
    const transport = await this.router.createWebRtcTransport({
      listenIps,
      enableUdp,
      preferUdp,
      enableTcp,
      initialAvailableOutgoingBitrate,
    });

    if(mediasoupConfig.maxIncomingBitrate){
      try{
        await transport.setMaxIncomingBitrate(mediasoupConfig.maxIncomingBitrate);
      } catch (e){
        console.log('failed to set maximum incoming bitrate');
      }
    }

    transport.on('dtlsstatechange', (dtlsState: soup.DtlsState) => {
      if(dtlsState === 'closed'){
        console.log('---transport close--- transport with id ' + transport.id + ' closed');
        transport.close();
      }
    });

    transport.on('close', () => console.log('---transport close--- transport with id ' + transport.id + ' closed'));

    return transport;
  }
}