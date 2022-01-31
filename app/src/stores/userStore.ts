
import { defineStore } from 'pinia';
// import { GatheringState } from 'shared-types/CustomTypes';

const rootState: {
  jwt: string
} = {
  jwt: '',
};

export const useUserStore = defineStore('user', {
  state: () => (rootState),
});
