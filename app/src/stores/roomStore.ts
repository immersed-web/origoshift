import { defineStore } from 'pinia';
import { RoomInfo } from 'app/../types/CustomTypes';

const rootState: {
  currentRoomId: string
  roomsInGathering: Record<string, RoomInfo>
} = {
  currentRoomId: '',
  roomsInGathering: {},
};

export const useRoomStore = defineStore('room', {
  state: () => (rootState),
});
