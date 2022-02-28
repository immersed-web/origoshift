import { defineStore } from 'pinia';
import { GatheringState, ClientState, RoomState, ShallowRoomState } from 'shared-types/CustomTypes';

let gatheringState: GatheringState | undefined;
// let roomState: RoomState | undefined;
let clientState: ClientState | undefined;

const rootState =
 {
   connected: false,
   //  currentRoomId: '',
   gatheringState,
   //  roomState,
   clientState,
 };

export const useSoupStore = defineStore('soup', {
  state: () => (rootState),
  getters: {
    clientId: (state) => {
      return state.clientState?.clientId;
    },
    roomId: (state) => {
      return state.clientState?.roomId;
    },
    roomState (): RoomState | undefined {
      if (!this.gatheringState?.rooms || !this.roomId) return undefined;
      const clients: RoomState['clients'] = {};
      for (const clientId of this.gatheringState.rooms[this.roomId].clients) {
        clients[clientId] = this.gatheringState.clients[clientId];
      }
      // const senderClients : RoomState['senderClients'] = {};
      // for (const clientId of this.gatheringState.rooms[this.roomId].senderClients) {
      //   senderClients[clientId] = this.gatheringState.clients[clientId];
      // }

      const roomState: RoomState = { ...this.gatheringState.rooms[this.roomId], clients };
      return roomState;
    },
    // clientState (): ClientState {
    //   if (this.gatheringState && this.clientState.roomId) {
    //     const room = this.gatheringState.rooms[this.clientState.roomId];
    //     const clientState = room.clients[this.clientState.clientId];
    //     return clientState;
    //   } else {
    //     return clientStateUnlinked;
    //   }
    // },
  },
  actions: {
    setGatheringState (gatheringState: GatheringState) {
      this.gatheringState = gatheringState;
      if (!this.clientId) { throw new Error('clientId is undefined. Something must have gone terribly wrong!!'); }
      // const allCLients = { ...this.gatheringState.clients, ...this.gatheringState.senderClients };
      const allCLients = { ...this.gatheringState.clients };
      if (!allCLients[this.clientId]) {
        throw new Error('client was not found in gatheringState object. Something must be off!');
      }
      console.log('gonna set clientState from data in gatheringState');
      this.clientState = allCLients[this.clientId];
    },
    setRoomState (roomState: RoomState) {
      if (!this.gatheringState) {
        throw new Error('no gatheringState! That is nooo good!');
      }
      if (!this.gatheringState.rooms[roomState.roomId]) {
        throw new Error('fuck no! Couldnt set roomstate because gatheringstate has no such room');
      }

      // Create a shallRoomState for the gatheringstate
      const clientIds = Object.keys(roomState.clients);
      // const senderClientIds = Object.keys(roomState.senderClients);
      const shallowRoomstate: ShallowRoomState = { ...roomState, clients: clientIds };
      this.gatheringState.rooms[roomState.roomId] = shallowRoomstate;

      // update/create the clients in gatheringstate from the (potentially) updated clients in the received roomstate
      for (const [clientId, client] of Object.entries(roomState.clients)) {
        this.gatheringState.clients[clientId] = client;
      }
      // for (const [clientId, client] of Object.entries(roomState.senderClients)) {
      //   this.gatheringState.senderClients[clientId] = client;
      // }
    },
    // setClientState (clientState: ClientState) {

    // },
  },
});
