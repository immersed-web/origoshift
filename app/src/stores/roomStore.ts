import { defineStore } from 'pinia';
import { GatheringState } from 'shared-types/CustomTypes';

const rootState: {
  currentRoomId: string
  gatheringState?: GatheringState
} = {
  currentRoomId: '',
  gatheringState: undefined,
};

export const useRoomStore = defineStore('room', {
  state: () => (rootState),
});
