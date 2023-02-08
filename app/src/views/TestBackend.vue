<template>
  <div class="grid gap-4 p-6 m-6">
    <p>health: {{ health }}</p>
    <p>greeting: {{ greeting }}</p>
  </div>
  <!-- <p>{{ token }}</p> -->
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient } from '@/modules/trpcClient';


// const token = ref<string>('');
const health = ref<string>('');
const greeting = ref<string>('');

onMounted(async () => {
  const client = await getClient();
  greeting.value = await client.greeting.query();
  health.value = await client.health.query();
});

</script>
