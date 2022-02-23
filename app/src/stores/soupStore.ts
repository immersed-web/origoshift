import { defineStore } from 'pinia';
import { GatheringState, ClientState, RoomState } from 'shared-types/CustomTypes';

let gatheringState: GatheringState | undefined;
// let roomState: RoomState | undefined;
let clientState: ClientState | undefined;
const rootState =
// : {
//   connected: boolean
//   currentRoomId: string
//   gatheringState?: GatheringState
// }
 {
   connected: false,
   //  currentRoomId: '',
   gatheringState,
   //  roomState,
   clientState,
 };

// let clientStateUnlinked: ClientState;

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
      return this.gatheringState.rooms[this.roomId];
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
      const allCLients = { ...this.gatheringState.clients, ...this.gatheringState.senderClients };
      if (!allCLients[this.clientId]) {
        throw new Error('client was not found in gatheringState object. Something must be off!');
      }
      console.log('gonna set clientState from data in gatheringState');
      this.clientState = allCLients[this.clientId];
    },
    setRoomState (roomState: RoomState) {
      if (!this.gatheringState?.rooms) {
        throw new Error('fuck no! Couldnt set roomstate because gatheringstate has no rooms props (or gatheringstate is undefined)');
      }
      this.gatheringState.rooms[roomState.roomId] = roomState;
    },
    // setClientState (clientState: ClientState) {

    // },
  },
});
