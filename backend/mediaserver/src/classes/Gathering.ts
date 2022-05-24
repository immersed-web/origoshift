import { randomUUID } from 'crypto';
import { GatheringState } from 'shared-types/CustomTypes';
import { createMessage } from 'shared-types/MessageTypes';
import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';
import debug from 'debug';
const gatheringLog = debug('Gathering');
const gatheringError = debug('Gathering:ERROR');
const gatheringWarn = debug('Gathering:WARNING');
// import Client from './Client';
import {types as soup} from 'mediasoup';

import Room from './Room';
import Client from './Client';
import { valueIsAlreadyTaken } from '../modules/utilFns';


export default class Gathering {
  // First some static stuff for global housekeeping
  private static gatherings: Map<string, Gathering> = new Map();

  static async createGathering(id?: string, name?: string, worker?: soup.Worker) {
    try {
      // We enforce uniqueness for eventNames!
      if(name){
        const gatheringNames = Array.from(this.gatherings.values()).map(gathering => gathering.name);
        if(valueIsAlreadyTaken(name, gatheringNames)){
          throw new Error('Gathering with that name already exists!!');
        }
      }
      if(id){
        const gatheringIds = Array.from(this.gatherings.keys());
        if(valueIsAlreadyTaken(id, gatheringIds)){
          throw new Error('NOT ACCEPTABLE! Gathering with that id already exists!!!');
        }
      }


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
    // gatheringLog('trying to get a gathering with params: ', params);
    // gatheringLog('gatherings map:', Gathering.gatherings);
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
    gatheringLog('searching gathering with name:',name);
    for (const [ _ , gathering] of Gathering.gatherings) {
      gatheringLog('checking gathering:', gathering);
      if(gathering.name === name){
        return gathering;
      }
    }
    throw new Error('couldnt find a gathering with that name!!! You fuckhead!');
  }


  id: string;
  name;
  router: soup.Router;

  // Is it a possible security risk that all:ish clients have a reference to the gathering and thus to the sender map?
  // private senderClients: Map<string, Client> = new Map();

  private rooms: Map<string, Room> = new Map();

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

  // addSender(client: Client){
  //   this.senderClients.set(client.id, client);
  //   this.broadCastGatheringState();
  // }

  // removeSender(client: Client){
  //   this.senderClients.delete(client.id);
  //   this.broadCastGatheringState();
  // }

  // getSender (clientId: string){
  //   const client = this.senderClients.get(clientId);
  //   if(!client){
  //     throw new Error('no client with that id in gathering');
  //   }
  //   return client;
  // }

  addClient ( client : Client){
    this.clients.set(client.id, client);
    client.setGathering(this.id);
    this.broadCastGatheringState([client.id], 'client added to gathering');
  }

  removeClient (client: Client) {
    // TODO: We should also handle if client leaves gathering while in a room. Here or elsewhere
    this.clients.delete(client.id);
    this.broadCastGatheringState( undefined, 'client removed from gathering');
    client.setGathering(undefined);

    if(!this.clients.size){
      this.destroy();
    }
  }
  
  destroy() {
    gatheringLog(`destroying gathering ${this.id} `);
    this.router.close();
    this.rooms.forEach(room => room.destroy());    
    Gathering.gatherings.delete(this.id);
  }

  // TODO: Somewhere in the server we probably need to protect access to this function 
  getClient (clientId: string){
    const client = this.clients.get(clientId);
    if(!client){
      throw new Error('no client with that id in gathering');
    }
    return client;
  }

  getRtpCapabilities(): soup.RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  createRoom({roomId, roomName}: {roomId?: string, roomName?: string}){
    if(roomId){
      this.rooms.forEach(room => {
        if(room.id === roomId){
          throw new Error('NO CAN DO!! A room with that ID already exists in the gathering.');
        }
      });
    }
    if(roomName){
      this.rooms.forEach(room => {
        if(room.roomName === roomName){
          throw new Error('NO CAN DO!! A room with that name already exists in the gathering.');
        }
      });
    }
    const room = Room.createRoom({roomId, roomName, gathering: this});
    this.rooms.set(room.id, room);
    this.broadCastGatheringState(undefined, 'room created');

    return room;
  }

  sendGatheringStateTo(client: Client, updateReason?: string){
    const state = this.gatheringState;
    let reason = 'update reason not specified';
    if(updateReason) reason = updateReason;
    const msg = createMessage('gatheringStateUpdated',{newState: state, reason });
    client.send(msg);
  }

  // TODO: We should throttle some or perhaps all of the broadcast functions so we protect from overload
  broadCastGatheringState(clientsToSkip: string[] = [], updateReason?: string) {
    gatheringLog(`gonna broadcast to ${this.clients.size} clients`);
    let reason = 'update reason not specified';
    if(updateReason) reason = updateReason;

    this.clients.forEach(client => {
      if(client.id in clientsToSkip){
        gatheringLog('skipping client:', client.id);
        return;
      }
      const gatheringStateMsg = createMessage('gatheringStateUpdated', {newState: this.gatheringState, reason});
      gatheringLog(`sending gatheringStateUpdated to client ${client.id}`);
      client.send(gatheringStateMsg);
    });
  }

  // TODO: will this truly suffice for deleting the room? Or will it float around as a deserted little vessel in the memory ocean?
  deleteRoom(roomOrId: Room | string){
    if(typeof roomOrId === 'string'){
      this.rooms.delete(roomOrId);
      return;
    }
    this.rooms.delete(roomOrId.id);
    this.broadCastGatheringState(undefined, 'room deleted');
  }

  get gatheringState() {
    // const gatheringState: GatheringState = { gatheringId: this.id, rooms: {}, senderClients: {}, clients: {} };
    const gatheringState: GatheringState = { gatheringId: this.id, rooms: {}, clients: {} };
    if(this.name){
      gatheringState.gatheringName = this.name;
    }
    this.rooms.forEach((room) => {
      const roomstate = room.shallowRoomState;
      gatheringState.rooms[room.id] = roomstate;
    });
    // this.senderClients.forEach(senderClient => {
    //   gatheringState.senderClients[senderClient.id] = senderClient.clientState;
    // });
    this.clients.forEach(client => {
      gatheringState.clients[client.id] = client.clientState;
    });
    return gatheringState;
  }

  getRoom({id, name}: {id?: string, name?: string}) {
    let foundRoom: Room | undefined;
    if(id){
      foundRoom = this.rooms.get(id);
    }
    if(name){
      for (const [ _ , room] of this.rooms) {
        if(room.roomName === name){
          foundRoom = room;
        }
      }
    }
    if(!foundRoom){
      throw new Error('the gathering doesnt have a room with that id or name');
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
        gatheringLog('failed to set maximum incoming bitrate');
      }
    }

    transport.on('dtlsstatechange', (dtlsState: soup.DtlsState) => {
      if(dtlsState === 'closed'){
        gatheringLog('---transport close--- transport with id ' + transport.id + ' closed');
        transport.close();
      }
    });

    transport.on('close', () => gatheringLog('---transport close--- transport with id ' + transport.id + ' closed'));

    return transport;
  }
}