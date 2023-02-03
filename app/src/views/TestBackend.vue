<template>
  <div class="grid gap-4 p-6 m-6">
    <button
      class="p-4 rounded-md bg-slate-400 text-slate-800"
      @click="loginAsAdmin"
    >
      Login as admin
    </button>
    <button @click="initTrpc">
      Connect to backend
    </button>
    <button @click="interactWithBackend">
      Communicate!
    </button>
  </div>
  <p>health: {{ health }}</p>
  <p>greeting: {{ greeting }}</p>
  <!-- <p>{{ token }}</p> -->
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
import type { AppRouter } from 'mediaserver';
import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';


// const token = ref<string>('');
const health = ref<string>('');
const greeting = ref<string>('');

onMounted(() => {
  autoGuestToken();
});

let t: ReturnType<typeof createTRPCProxyClient<AppRouter>> | undefined = undefined;


async function initTrpc () {
  const client = createWSClient({url: `ws://localhost:9001?${latestGuestJwtToken}`});
  t = createTRPCProxyClient<AppRouter>({
    links: [
      wsLink({client}),
    ],
  });
}


async function interactWithBackend(){
  if(!t){
    return;
  }
  let response = await t.health.query();
  health.value = response;

  const greetResponse = await t.greeting.query();
  greeting.value = greetResponse;

}

async function loginAsAdmin(){
  loginWithAutoToken('superadmin', 'bajskorv');
  // await login('superadmin', 'bajskorv');
  // token.value = await getJwt();
}

</script>
