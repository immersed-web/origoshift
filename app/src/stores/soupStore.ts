import { defineStore } from 'pinia';
import { GatheringState, ClientState, RoomState } from 'shared-types/CustomTypes';

let gatheringState: GatheringState | undefined;
let roomState: RoomState | undefined;
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
   //  clientState,
 };

let clientStateUnlinked: ClientState;

export const useSoupStore = defineStore('soup', {
  state: () => (rootState),
  getters: {
    roomState: (state) => {
      if (!state.gatheringState?.rooms || !state.clientState?.roomId) return undefined;
      return state.gatheringState.rooms[state.clientState.roomId];
    },
    clientState (): ClientState {
      if (this.gatheringState && this.clientState.roomId) {
        const room = this.gatheringState.rooms[this.clientState.roomId];
        const clientState = room.clients[this.clientState.clientId];
        return clientState;
      } else {
        return clientStateUnlinked;
      }
    },
  },
  actions: {
    setGatheringState (gatheringState: GatheringState) {
      this.gatheringState = gatheringState;
      // if(this.gatheringState.rooms)
    },
    setRoomState (roomState: RoomState) {
      if (!this.gatheringState?.rooms) {
        throw new Error('fuck no! Couldnt set roomstate because gatheringstate has no rooms props (or gatheringstate is undefined)');
      }
      this.gatheringState.rooms[roomState.roomId] = roomState;
    },
    setClientState (clientState: ClientState) {

    },
  },
});
