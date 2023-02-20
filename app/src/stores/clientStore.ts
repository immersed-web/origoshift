// import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
// import type { ClientTransform, ConnectionId } from 'schemas';

export const useClientStore = defineStore('client', {
  state: () => ({
    greeting: '',
    health: '',
    heartbeat: '',
    venuesAll: [] as RouterOutputs['venue']['listMyVenues'],
    venuesLoaded: {} as RouterOutputs['venue']['listLoadedVenues'],
    positionData: {},
  }),
  getters: {
  },
  actions: {
  },
});
