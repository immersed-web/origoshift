import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { getClient } from '@/modules/trpcClient';
import type { ClientTransform, ConnectionId } from 'schemas';

export const useClientStore = defineStore('client', {
  state: () => ({
    greeting: '',
    health: '',
    heartbeat: '',
    venuesAll: [] as Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listMyVenues']['query']>>,
    venuesLoaded: {} as Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listLoadedVenues']['query']>>,
    positionData: {},
  }),
  getters: {
  },
  actions: {
  },
});
