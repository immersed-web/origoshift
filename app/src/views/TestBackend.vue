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
      <XButton @click="async () => loadedVenues = await getClient().venue.listLoadedVenues.query()">
        List loaded venues
      </XButton>
      <XButton @click="async () => await getClient().venue.leaveCurrentVenue.query()">
        Leave current venue
      </XButton>
      <XButton @click="startTransformStream">
        Start transform stream
      </XButton>
    </div>

    <div class="grid grid-cols-3 gap-4 p-6 m-6">
      <div>
        <p>health: {{ health }}</p>
        <p>greeting: {{ greeting }}</p>
        <p>venueId: {{ venueId }}</p>
        <p>connection: {{ connectionId }}</p>
        <p>slider: {{ slider }}</p>
        <XSlider
          :min="1"
          :max="200"
          label="Slide me"
          :model-value="slider"
          @update:modelValue="onSlide"
        />
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
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient, startGuestClient, startLoggedInClient } from '@/modules/trpcClient';
import type { ClientTransform, ConnectionId } from 'schemas';

const venueId = ref<string>('');
const connectionId = ref<ConnectionId>();

const ownedVenues = ref<Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listMyVenues']['query']>>>([]);
const loadedVenues = ref<Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listLoadedVenues']['query']>>>({});

const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});
const slider = ref<number>(0);

function onSlide(evt: number) {
  slider.value = evt;
  getClient().vr.transforms.updateTransform.mutate({
    position: [slider.value, 0, 0],
    orientation: [0,0,0,0],
  });
}

const subToHeartBeat = () => getClient().subHeartBeat.subscribe(undefined, {
  onData(heartbeat){console.log(heartbeat);},
});
const testGreeting = async () => { greeting.value = await getClient().greeting.query(); console.log(greeting.value);};

let stopTransformStream: () => void;
function startTransformStream() {
  if(stopTransformStream) stopTransformStream();
  const subscription = getClient().vr.transforms.subClientTransforms.subscribe(undefined, {
    onData(data) {
      console.log('received transform data!', data);
      positionData.value = data;
      for(const [k, t] of Object.entries(data) as [ConnectionId, ClientTransform][]){
        if(k !== connectionId.value){
          slider.value = t.position[0];
        }
      }
    },
  });
  // const intv = setInterval(async () => await getClient().vr.transforms.updateTransform.mutate(({position: [Math.random(),Math.random(),Math.random()], orientation: [Math.random(),Math.random(),Math.random(),Math.random()]})), 200);
  stopTransformStream = () => {
    // clearInterval(intv);
    subscription.unsubscribe();
  };
}

onMounted(async () => {
  await startGuestClient();
  const client = getClient();
  connectionId.value = await client.getConnectionId.query();
  console.log(connectionId.value);

  client.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      console.log(data);
    },
  });

  // client.testSubCompletable.subscribe(undefined, {onData(data){console.log(data);}});
  // setTimeout(() => client.clearObservers.mutate(), 7000);

  greeting.value = await client.greeting.query();
  health.value = await client.health.query();
});

onBeforeUnmount(() => {
  if(stopTransformStream){
    stopTransformStream();
  }
});

</script>
