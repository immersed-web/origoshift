<template>
  <div class="grid gap-4 p-6 m-6">
    <p>health: {{ health }}</p>
    <p>greeting: {{ greeting }}</p>
  </div>
  <pre>
    {{ positionData }}
  </pre>
  <!-- <p>{{ token }}</p> -->
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient, type RouterOutputs  } from '@/modules/trpcClient';
import type { ClientPosition } from 'schemas';

type subscriptionOutput = RouterOutputs['vr']['clientTransforms']

// const token = ref<string>('');
const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});

onMounted(async () => {
  const client = await getClient();
  const sub = client.vr.transforms.clientTransformsSub.subscribe(undefined, {
    onData(data){
      console.log(data);
      positionData.value = data;
      // for(const key in data){
      //   console.log(data[key]);
      // }
    },
  });
  setInterval(async () => {

    const randomPos: ClientPosition['position'] = [Math.random(),Math.random(),Math.random()];
    const randomRot: ClientPosition['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
    await client.vr.transforms.updateTransform.mutate({orientation: randomRot, position: randomPos});
  }, 50);

  greeting.value = await client.greeting.query();
  health.value = await client.health.query();
});

</script>
