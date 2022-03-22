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

function unshallowRoomState (shallowRoomState: ShallowRoomState, allClients: GatheringState['clients']): RoomState {
  const presentClients: RoomState['clients'] = {};
  for (const clientId of shallowRoomState.clients) {
    presentClients[clientId] = allClients[clientId];
  }

  const roomState: RoomState = { ...shallowRoomState, clients: presentClients };
  return roomState;
}

export const useSoupStore = defineStore('soup', {
  state: () => ({ ...rootState }),
  getters: {
    clientId: (state) => {
      return state.clientState?.clientId;
    },
    roomId: (state) => {
      return state.clientState?.roomId;
    },
    roomState (): RoomState | undefined {
      if (!this.rooms || !this.roomId) return undefined;
      return this.rooms[this.roomId];
    },
    rooms: (state): Record<string, RoomState> | undefined => {
      if (!state.gatheringState || !state.gatheringState.rooms) {
        return undefined;
      }
      // Seems I have to use this intermediate variable to make ts understand the gathering is narrowed from undefined... sigh...
      const gatheringState: GatheringState = state.gatheringState;
      const shallowRooms: ShallowRoomState [] = Object.values(state.gatheringState.rooms);
      const rooms: Record<string, RoomState> = {};
      for (const shallowRoom of shallowRooms) {
        rooms[shallowRoom.roomId] = unshallowRoomState(shallowRoom, gatheringState.clients);
      }
      return rooms;
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

      if (!this.clientId) {
        throw new Error('clientId was undeinfed inside setRoomState action');
      }

      // update clientState from the (potentially) updated clientobject in roomstate
      if (this.clientId in roomState.clients) {
        this.clientState = roomState.clients[this.clientId];
      }
    },
  },
});
