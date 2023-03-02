import { defineStore } from 'pinia';
// import {  client, startSenderClient, type RouterOutputs } from '@/modules/trpcClient';
import { logout, loginWithAutoToken, login, userAutoToken } from '@/modules/authClient';
import jwtDecode from 'jwt-decode';
import type { JwtPayload } from 'schemas';

const hasCookie = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${import.meta.env.EXPOSED_PROJECT_NAME}=`))
    ?.split('=')[1];
  return !!cookieValue;
};
export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      token: undefined as string | undefined,
      hasCookie: hasCookie(),
    };
  },
  getters: {
    userData: (state) => {
      try {
        if (!state.token) {
          throw new Error('token is undefined');
        }
        const decodedToken = jwtDecode<JwtPayload>(state.token);
        // console.log(decodedToken);
        return decodedToken;
        // return JSON.parse(window.atob(state.jwt.split('.')[1])) as UserData;
      } catch (e) {
        return undefined;
      }
    },
    isLoggedIn: (state) => {
      return 'NOT IMPLEMENTED YET';
      // return !!state.clientState.userId;
    },
  },
  actions: {
    async restoreFromSession(){
      if(!this.hasCookie){
        console.warn('You will need to have a cookie set in order to restore a persisted login session');
      }
      await userAutoToken((t) => this.token = t);

    },
    async logout() {
      await logout();
      // this.hasCookie = hasCookie();
      this.$reset();
    },
    async login (username: string, password: string ) {
      await login(username, password);
      this.hasCookie = hasCookie();
      await userAutoToken((t) => {
        console.log('new token! ', t);
        this.token = t;
      });
      // client.value.sender.subClientState.subscribe(undefined, {
      //   onData: (data) => {
      //     console.log(`clientState received. Reason: ${data.reason}`);
      //     this.clientState = data.clientState;
      //   },
      // });
      // await this.updateClientState();
      // await this.queryVenuesLoaded();
    },
  },
});
