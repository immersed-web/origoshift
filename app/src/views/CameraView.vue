<template>
  <div
    v-if="false"
    class="text-9xl"
  >
    Kamera-vy!
  </div>
  <LoginBox
    v-else
    title="Logga in som sändare"
    description="Logga in här för att skicka kameraström"
    :error="error"
    @submit="tryToLogin"
  />
  <button
    class="btn"
    @click="authStore.logout"
  >
    Logga ut
  </button>
  <button
    class="btn"
    @click="getMe()"
  >
    Get me
  </button>
</template>

<style>
</style>

<script setup lang="ts">
import LoginBox from '@/components/LoginBox.vue';
import { startSenderClient} from '@/modules/trpcClient';
import { getMe } from '@/modules/authClient';
import { useAuthStore } from '@/stores/authStore';
import { onBeforeMount, ref } from 'vue';
const authStore = useAuthStore();

const error = ref<Error>();
onBeforeMount(async () => {
  if(authStore.hasCookie){
    await authStore.restoreFromSession();
  }
});

async function tryToLogin(username: string, password: string) {
  try {
    authStore.login(username, password);
    // const state = await client.value.sender.getClientState.query();
  } catch (e) {
    if(e instanceof Error){
      error.value = e;
    }
  }
}
</script>
