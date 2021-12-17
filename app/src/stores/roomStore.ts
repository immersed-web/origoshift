import { defineStore } from 'pinia';
// import { RoomInfo } from 'app/../types/CustomTypes';
import { RoomState } from 'shared-types/CustomTypes';

const rootState: {
  currentRoomId: string
  roomsInGathering: Record<string, RoomState>
} = {
  currentRoomId: '',
  roomsInGathering: {},
};

export const useRoomStore = defineStore('room', {
  state: () => (rootState),
});
