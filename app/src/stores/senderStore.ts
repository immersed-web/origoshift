import { defineStore } from 'pinia';
import {  client, startSenderClient, type RouterOutputs } from '@/modules/trpcClient';

export const useSenderStore = defineStore('sender', {
  state: () => ({
    clientState: {} as RouterOutputs['sender']['getClientState'],
  }),
  getters: {
    loggedIn: (state) => {
      return !!state.clientState.userId;
    },
  },
  actions: {
    async login (username: string, password: string ) {
      await startSenderClient(username, password);
      this.clientState = await client.value.sender.getClientState.query();
      // client.value.sender.subClientState.subscribe(undefined, {
      //   onData: (data) => {
      //     console.log(`clientState received. Reason: ${data.reason}`);
      //     this.clientState = data.clientState;
      //   },
      // });
      // await this.updateClientState();
      // await this.queryVenuesLoaded();
      return this.clientState;
    },
  },
});
