import { defineStore } from 'pinia';
import {clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import { useAuthStore } from './authStore';
import { useConnectionStore } from './connectionStore';

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
      const auth = useAuthStore();
      await auth.login(username, password);
      const connection = useConnectionStore();
      connection.createSenderClient();
      this.clientState = await clientOrThrow.value.sender.getClientState.query();
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
