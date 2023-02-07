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
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient } from '@/modules/trpcClient';

const client = await getClient;

// const token = ref<string>('');
const health = ref<string>('');
const greeting = ref<string>('');

greeting.value = await client.greeting.query();
health.value = await client.health.query();
onMounted(() => {
});

</script>
