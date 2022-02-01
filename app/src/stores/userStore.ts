
import { defineStore } from 'pinia';
// import { GatheringState } from 'shared-types/CustomTypes';

const rootState: {
  jwt: string
} = {
  jwt: '',
};

export const useUserStore = defineStore('user', {
  state: () => (rootState),
  getters: {
    userData: (state) => {
      try {
        return JSON.parse(window.atob(state.jwt.split('.')[1]));
      } catch (e) {
        return '';
      }
    },
  },
});
