import { defineStore } from 'pinia';
import { GatheringState, ClientState } from 'shared-types/CustomTypes';

let gatheringState: GatheringState | undefined;
let clientState: ClientState | undefined;
const rootState =
// : {
//   connected: boolean
//   currentRoomId: string
//   gatheringState?: GatheringState
// }
 {
   connected: false,
   currentRoomId: '',
   gatheringState,
   clientState,
 };

export const useSoupStore = defineStore('soup', {
  state: () => (rootState),
  getters: {
    currentRoom: (state) => {
      if (!state.gatheringState?.rooms || !state.currentRoomId) return undefined;
      return state.gatheringState.rooms[state.currentRoomId];
    },
  },
});
