
// import { UserData } from 'app/../packages/shared-types/CustomTypes';
import { defineStore } from 'pinia';
// import { GatheringState } from 'shared-types/CustomTypes';

const rootState: {
  roomName?: string,
  gatheringName?: string,
} = {
  roomName: undefined,
  gatheringName: undefined,
};

export const usePersistedStore = defineStore('persisted', {
  persist: true,
  state: () => (rootState),
  // getters: {
  //   userData: (state): UserData | undefined => {
  //     try {
  //       return JSON.parse(window.atob(state.jwt.split('.')[1]));
  //     } catch (e) {
  //       return undefined;
  //     }
  //   },
  // },
});
