import { startSenderClient, startUserClient } from '@/modules/trpcClient';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './authStore';


export const useConnectionStore = defineStore('connection', () => {
  const authStore = useAuthStore();
  const connected = ref(false);

  const createSenderClient = () => {
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    startSenderClient(() => authStore.tokenOrThrow);
  };

  const createUserClient = () => {
    if(!authStore.isLoggedIn){
      console.error('Trying to create client when not logged in. Ignoring!');
    }
    startUserClient(() => authStore.tokenOrThrow);
  };

  return {
    connected,
    createSenderClient,
    createUserClient,
  };
});
