<template>
  <div class="m-4">
    <XButton @click="testGreeting">
      Greet
    </XButton>
    <XButton
      @click="async () => client = await startLoggedInClient('superadmin', 'bajskorv')"
      class="m-6"
    >
      Login as Admin
    </XButton>
    <XButton @click="subToHeartBeat">
      Subscribe to heartbeat
    </XButton>
    <XButton
      @click="async () =>venueId = await client.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 100)}`})"
      class="m-6"
    >
      Create a new venue!!!
    </XButton>
    <XButton
      @click="client.venue.loadVenue.mutate({uuid: venueId})"
      class="m-6"
    >
      Load venue
    </XButton>
    <XButton
      @click="client.venue.joinVenue.mutate({uuid: venueId})"
      class="m-6"
    >
      Join venue
    </XButton>
    <div class="grid gap-4 p-6 m-6">
      <p>health: {{ health }}</p>
      <p>greeting: {{ greeting }}</p>
      <p>venueId: {{ venueId }}</p>
    </div>
    <pre>
    {{ positionData }}
  </pre>
  <!-- <p>{{ token }}</p> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient, startGuestClient, startLoggedInClient } from '@/modules/trpcClient';
import type { ClientTransform } from 'schemas';


const venueId = ref<string>('');

const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});

let client: Awaited<ReturnType<typeof getClient>>;
const subToHeartBeat = () => getClient().heartbeatSub.subscribe(undefined, {
  onData(heartbeat){console.log(heartbeat);},
});
const testGreeting = async () => console.log(await getClient().greeting.query());
onMounted(async () => {
  await startGuestClient();
  client = getClient()
  const connection = await client.getMe.query();
  console.log(connection);
  // client.venue.createNewVenue.mutate({name: 'TestVenue'});
  const sub = client.vr.transforms.clientTransformsSub.subscribe(undefined, {
    onData(data){
      console.log(data);
      positionData.value = data;
      // for(const key in data){
      //   console.log(data[key]);
      // }
    },
  });
  // setInterval(async () => {

  //   const randomPos: ClientTransform['position'] = [Math.random(),Math.random(),Math.random()];
  //   const randomRot: ClientTransform['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
  //   await client.vr.transforms.updateTransform.mutate({orientation: randomRot, position: randomPos});
  // }, 50);

  greeting.value = await client.greeting.query();
  health.value = await client.health.query();
});

</script>
