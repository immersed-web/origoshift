import { randomUUID } from 'crypto';
// import { GatheringState } from 'shared-types/CustomTypes';
// import { createMessage } from 'shared-types/MessageTypes';
import mediasoupConfig from '../mediasoupConfig';
import { getMediasoupWorker } from '../modules/mediasoupWorkers';
import debug from 'debug';
const Log = debug('Gathering');
const Err = debug('Gathering:ERROR');
const Warn = debug('Gathering:WARNING');
// import Client from './Client';
import {types as soupTypes} from 'mediasoup';
import { Uuid } from 'schemas';

import prisma from '../modules/prismaClient';

// import Room from './Room';
import Client from './Client';
// import { valueIsAlreadyTaken } from '../modules/utilFns';


export default class Venue {
  // First some static stuff for global housekeeping
  private static venues: Map<string, Venue> = new Map();

  static async createNewVenue(name: string){
    // throw new Error('Gathering with that name already exists!!');
    // TODO: Not implemented yet. Use prisma to create db record here
    return 'Not implemented yet' as const;
  }
  static async instantiateVenue(uuid: Uuid, worker?: soupTypes.Worker) {
    try {
      const dbResponse = await prisma.venue.findUniqueOrThrow({
        where: {
          uuid
        },
      });

      if(!worker){
        worker = getMediasoupWorker();
      }
      const router = await worker.createRouter(mediasoupConfig.router);
      const venue = new Venue(dbResponse.uuid, dbResponse, router);
      return venue;
    } catch (e) {
      console.error('failed to create venue');
      throw e;
    }
  }

  // static getVenue(params:{id?: string, name?:string}) {
  //   // gatheringLog('trying to get a gathering with params: ', params);
  //   // gatheringLog('gatherings map:', Gathering.gatherings);
  //   if(params.id){

  //     const gathering = Venue.venues.get(params.id);
  //     if(!gathering){
  //       throw new Error('a gathering with that id doesnt exist');
  //     }
  //     return gathering;
  //   }else if(params.name){
  //     return this.getGatheringFromName(params.name);
  //   } else {
  //     throw new Error('no id or name provided. Cant get gathering! Duuuh!');
  //   }
  // }

  // private static getGatheringFromName(name:string): Venue {
  //   Log('searching gathering with name:',name);
  //   for (const [ _ , gathering] of Venue.venues) {
  //     Log('checking gathering:', gathering);
  //     if(gathering.name === name){
  //       return gathering;
  //     }
  //   }
  //   throw new Error('couldnt find a gathering with that name!!! You fuckhead!');
  // }


  uuid: Uuid;
  router: soupTypes.Router;
  prismaData: Awaited<ReturnType<typeof prisma.venue.findUniqueOrThrow>>;


  // Is it a possible security risk that all:ish clients have a reference to the gathering and thus to the sender map?
  // private senderClients: Map<string, Client> = new Map();

  // private rooms: Map<string, Room> = new Map();

  private clients: Map<string, Client> = new Map();

  private constructor(uuid = randomUUID(), prismaData: Awaited<ReturnType<typeof prisma.venue.findUniqueOrThrow>>, router: soupTypes.Router){
    this.uuid = uuid;
    this.router = router;
    this.prismaData = prismaData;

    // const alreadyExistingGathering = Venue.venues.get(this.id);
    // if(alreadyExistingGathering){
    //   console.error('already exists a gathering with that id!');
    //   throw new Error('cant create gathering with already taken id');
    //   // return;
    // }

    Venue.venues.set(this.uuid, this);
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

  // addClient ( client : Client){
  //   this.clients.set(client.connectionId, client);
  //   client.setGathering(this.uuid);
  //   this.broadCastGatheringState([client.connectionId], 'client added to gathering');
  // }

  // removeClient (client: Client) {
  //   // TODO: We should also handle if client leaves gathering while in a room. Here or elsewhere
  //   this.clients.delete(client.connectionId);
  //   this.broadCastGatheringState( undefined, 'client removed from gathering');
  //   client.setGathering(undefined);

  //   if(!this.clients.size){
  //     this.destroy();
  //   }
  // }

  // destroy() {
  //   Log(`destroying gathering ${this.uuid} `);
  //   this.router.close();
  //   this.rooms.forEach(room => room.destroy());
  //   Venue.venues.delete(this.uuid);
  // }

  // getClient (clientId: string){
  //   const client = this.clients.get(clientId);
  //   if(!client){
  //     throw new Error('no client with that id in gathering');
  //   }
  //   return client;
  // }

  // getRtpCapabilities(): soupTypes.RtpCapabilities {
  //   return this.router.rtpCapabilities;
  // }

  // createRoom({roomId, roomName}: {roomId?: string, roomName: string}){
  //   if(roomId){
  //     this.rooms.forEach(room => {
  //       if(room.id === roomId){
  //         throw new Error('NO CAN DO!! A room with that ID already exists in the gathering.');
  //       }
  //     });
  //   }
  //   if(roomName){
  //     this.rooms.forEach(room => {
  //       if(room.roomName === roomName){
  //         throw new Error('NO CAN DO!! A room with that name already exists in the gathering.');
  //       }
  //     });
  //   }
  //   const room = Room.createRoom({roomId, roomName, gathering: this});
  //   this.rooms.set(room.id, room);
  //   this.broadCastGatheringState(undefined, 'room created');

  //   return room;
  // }

  // sendGatheringStateTo(client: Client, updateReason?: string){
  //   const state = this.gatheringState;
  //   let reason = 'update reason not specified';
  //   if(updateReason) reason = updateReason;
  //   const msg = createMessage('gatheringStateUpdated',{newState: state, reason });
  //   client.send(msg);
  // }

  // // TODO: We should throttle some or perhaps all of the broadcast functions so we protect from overload
  // broadCastGatheringState(clientsToSkip: string[] = [], updateReason?: string) {
  //   Log(`gonna broadcast to ${this.clients.size} clients`);
  //   let reason = 'update reason not specified';
  //   if(updateReason) reason = updateReason;

  //   this.clients.forEach(client => {
  //     if(client.connectionId in clientsToSkip){
  //       Log('skipping client:', client.connectionId);
  //       return;
  //     }
  //     const gatheringStateMsg = createMessage('gatheringStateUpdated', {newState: this.gatheringState, reason});
  //     Log(`sending gatheringStateUpdated to client ${client.connectionId}`);
  //     client.send(gatheringStateMsg);
  //   });
  // }

  // deleteRoom(roomOrId: Room | string){
  //   if(typeof roomOrId === 'string'){
  //     this.rooms.delete(roomOrId);
  //     return;
  //   }
  //   this.rooms.delete(roomOrId.id);
  //   this.broadCastGatheringState(undefined, 'room deleted');
  // }

  // get gatheringState() {
  //   // const gatheringState: GatheringState = { gatheringId: this.id, rooms: {}, senderClients: {}, clients: {} };
  //   const gatheringState: GatheringState = { gatheringId: this.uuid, rooms: {}, clients: {} };
  //   if(this.name){
  //     gatheringState.gatheringName = this.name;
  //   }
  //   this.rooms.forEach((room) => {
  //     const roomstate = room.shallowRoomState;
  //     gatheringState.rooms[room.id] = roomstate;
  //   });
  //   // this.senderClients.forEach(senderClient => {
  //   //   gatheringState.senderClients[senderClient.id] = senderClient.clientState;
  //   // });
  //   this.clients.forEach(client => {
  //     gatheringState.clients[client.connectionId] = client.clientState;
  //   });
  //   return gatheringState;
  // }

  // getRoom({id, name}: {id?: string, name?: string}) {
  //   let foundRoom: Room | undefined;
  //   if(id){
  //     foundRoom = this.rooms.get(id);
  //   }
  //   if(name){
  //     for (const [ _ , room] of this.rooms) {
  //       if(room.roomName === name){
  //         foundRoom = room;
  //       }
  //     }
  //   }
  //   if(!foundRoom){
  //     throw new Error('the gathering doesnt have a room with that id or name');
  //   }
  //   return foundRoom;
  // }

  // async createWebRtcTransport() {
  //   const transport = await this.router.createWebRtcTransport(mediasoupConfig.webRtcTransport);

  //   // const { listenIps, enableUdp, enableTcp, preferUdp, initialAvailableOutgoingBitrate } = mediasoupConfig.webRtcTransport;
  //   // const transport = await this.router.createWebRtcTransport({
  //   //   listenIps,
  //   //   enableUdp,
  //   //   preferUdp,
  //   //   enableTcp,
  //   //   initialAvailableOutgoingBitrate,
  //   // });

  //   if(mediasoupConfig.maxIncomingBitrate){
  //     try{
  //       await transport.setMaxIncomingBitrate(mediasoupConfig.maxIncomingBitrate);
  //     } catch (e){
  //       Log('failed to set maximum incoming bitrate');
  //     }
  //   }

  //   transport.on('dtlsstatechange', (dtlsState: soupTypes.DtlsState) => {
  //     if(dtlsState === 'closed'){
  //       Log('---transport close--- transport with id ' + transport.id + ' closed');
  //       transport.close();
  //     }
  //   });

  //   // TODO: Why not work anymore????
  //   // transport.on('close', () => gatheringLog('---transport close--- transport with id ' + transport.id + ' closed'));

  //   return transport;
  // }
}
