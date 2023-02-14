<template>
  <div class="m-6">
    <div class="grid grid-flow-col gap-4 auto-cols-min">
      <XButton
        @click="testGreeting"
      >
        Greet
      </XButton>
      <XButton
        @click="async () => await startLoggedInClient('superadmin', 'bajskorv')"
        class=""
      >
        Login as Admin
      </XButton>
      <XButton @click="subToHeartBeat">
        Subscribe to heartbeat
      </XButton>
      <XButton
        @click="async () =>venueId = await getClient().venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`})"
        class=""
      >
        Create a new venue!!!
      </XButton>
      <XButton @click="async () => ownedVenues = await getClient().venue.listMyVenues.query()">
        List my venues
      </XButton>
      <XButton @click="async () => loadedVenues = await getClient().venue.listLoadedVenue.query()">
        List loaded venues
      </XButton>
      <XButton @click="async () => await getClient().venue.leaveCurrentVenue.query()">
        Leave current venue
      </XButton>
    </div>

    <div class="grid grid-cols-3 gap-4 p-6 m-6">
      <div>
        <p>health: {{ health }}</p>
        <p>greeting: {{ greeting }}</p>
        <p>venueId: {{ venueId }}</p>
      </div>
      <div>
        <div
          v-for="venue in ownedVenues"
          :key="venue.uuid"
        >
          <p>{{ venue.name }}</p>
          <XButton
            size="xs"
            @click="async () => await getClient().venue.loadVenue.mutate({uuid: venue.uuid})"
          >
            Load
          </XButton>
          <XButton
            size="xs"
            class="ml-2"
            @click="async () => await getClient().venue.joinVenue.mutate({uuid: venue.uuid})"
          >
            Join
          </XButton>
          <XButton
            class="ml-2"
            color="red"
            size="xs"
            @click="async () => await getClient().venue.deleteVenue.mutate({uuid: venue.uuid})"
          >
            Ta bort
          </XButton>
        </div>
      </div>
      <div>
        <div
          v-for="venue in loadedVenues"
          :key="venue.venueId"
        >
          <p>{{ venue.name }}</p>
          <XButton
            size="xs"
            class="ml-2"
            @click="async () => await getClient().venue.joinVenue.mutate({uuid: venue.venueId})"
          >
            Join
          </XButton>
        </div>
      </div>
    </div>
    <pre>
      {{ positionData }}
    </pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient, startGuestClient, startLoggedInClient } from '@/modules/trpcClient';

const venueId = ref<string>('');

const ownedVenues = ref<Awaited<ReturnType<typeof client.venue.listLoadedVenue.query>>>();
const loadedVenues = ref<Awaited<ReturnType<typeof client.venue.listLoadedVenue.query>>>({});

const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});

let client: Awaited<ReturnType<typeof getClient>>;
const subToHeartBeat = () => getClient().heartbeatSub.subscribe(undefined, {
  onData(heartbeat){console.log(heartbeat);},
});
const testGreeting = async () => { greeting.value = await getClient().greeting.query(); console.log(greeting.value);};
onMounted(async () => {
  await startGuestClient();
  client = getClient();
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
