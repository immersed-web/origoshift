// import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
// import type { ClientTransform, ConnectionId } from 'schemas';
import { client, startLoggedInClient } from '@/modules/trpcClient';
import type { ClientTransforms } from 'schemas/*';

export const useClientStore = defineStore('client', {
  state: () => ({
    clientState: {} as RouterOutputs['getClientState'],
    greeting: '',
    health: '',
    heartbeat: '',
    venuesAll: [] as RouterOutputs['venue']['listMyVenues'],
    // venuesLoaded: {} as RouterOutputs['venue']['listLoadedVenues'],
    clientTransforms: {} as ClientTransforms,
  }),
  getters: {
    loggedIn: (state) => {
      return !!state.clientState.userId;
    },
  },
  actions: {
    async login (username: string, password: string ) {
      await startLoggedInClient(username, password);
      this.clientState = await client.value.getClientState.query();
      client.value.subClientState.subscribe(undefined, {
        onData: (data) => {
          console.log(`clientState received. Reason: ${data.reason}`);
          this.clientState = data.clientState;
        },
      });
      // await this.updateClientState();
      await this.queryVenuesAll();
      // await this.queryVenuesLoaded();
      return this.clientState;
    },
    async queryVenuesAll () {
      this.venuesAll = await client.value.venue.listMyVenues.query();
    },
    // async queryVenuesLoaded () {
    //   this.venuesLoaded = await client.value.venue.listLoadedVenues.query();
    // },
    async createVenue () {
      await client.value.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`});
      this.queryVenuesAll();
    },
    // TODO: Should be replaced by subscription
    async updateClientState () {
      this.clientState = await client.value.getClientState.query();
    },
  },
});
