// import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
// import type { ClientTransform, ConnectionId } from 'schemas';
import { clientOrThrow } from '@/modules/trpcClient';
import type { ClientTransforms } from 'schemas';
import { useConnectionStore } from './connectionStore';

export const useClientStore = defineStore('client', {
  state: () => ({
    clientState: {} as RouterOutputs['user']['getClientState'],
    // greeting: '',
    // health: '',
    // heartbeat: '',
    // venuesAll: [] as RouterOutputs['venue']['listMyVenues'],
    // venuesLoaded: {} as RouterOutputs['venue']['listLoadedVenues'],
    clientTransforms: {} as ClientTransforms,
  }),
  getters: {
    loggedIn: (state) => {
      return !!state.clientState.userId;
    },
    initials: (state) => {
      return state.clientState.userName ? state.clientState.userName.split(' ').map(n => n[0]).join('') : '';
    },
  },
  actions: {
    async initConnection() {
      const connection = useConnectionStore();
      connection.createUserClient();

      // await startLoggedInClient(username, password);
      this.clientState = await clientOrThrow.value.user.getClientState.query();
      // await this.updateClientState();
      clientOrThrow.value.user.subClientState.subscribe(undefined, {
        onData: (data) => {
          console.log(`clientState received. Reason: ${data.reason}`);
          this.clientState = data.clientState;
        },
      });
      // await this.queryVenuesAll();
      // await this.queryVenuesLoaded();
      return this.clientState;
    },
    // async queryVenuesAll () {
    //   this.venuesAll = await clientOrThrow.value.venue.listMyVenues.query();
    // },
    // async queryVenuesLoaded () {
    //   this.venuesLoaded = await client.value.venue.listLoadedVenues.query();
    // },
    // async createVenue () {
    //   await clientOrThrow.value.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`});
    //   // this.queryVenuesAll();
    // },
    // TODO: Should be replaced by subscription
    async updateClientState () {
      this.clientState = await clientOrThrow.value.user.getClientState.query();
    },
  },
});
