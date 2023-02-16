<template>
  <div class="">
    <div class="flex flex-col gap-2">
      <!-- <XButton
        @click="testGreeting"
      >
        Get greeting
      </XButton> -->
      <XButton
        @click="loginAsAdmin"
        class=""
      >
        Login as Admin
      </XButton>
      <!-- <XButton @click="subToHeartBeat">
        Subscribe to heartbeat
      </XButton> -->
      <!-- <XButton @click="getVenues">
        List my venues
      </XButton> -->

      <strong>My venues</strong>
      <div>
        <div
          v-for="venue in clientStore.venuesAll"
          :key="venue.uuid"
        >
          <p>{{ venue.name }}</p>
          <XButton
            size="xs"
            @click="loadVenue(venue.uuid)"
          >
            Load
          </XButton>
          <!-- <XButton
            size="xs"
            class="ml-2"
            @click="async () => await getClient().venue.joinVenue.mutate({uuid: venue.uuid})"
          >
            Join
          </XButton> -->
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
      <XButton
        @click="createVenue"
        class=""
      >
        Create venue
      </XButton>

      <!-- <XButton @click="async () => loadedVenues = await getClient().venue.listLoadedVenues.query()">
        List loaded venues
      </XButton> -->
      <strong>Loaded venues</strong>
      <div>
        <div
          v-for="venue in clientStore.venuesLoaded"
          :key="venue.venueId"
        >
          <p>{{ venue.name }}</p>
          <XButton
            size="xs"
            class="ml-2"
            @click="joinVenue(venue.venueId)"
          >
            Join
          </XButton>
        </div>
      </div>
      <XButton @click="async () => await getClient().venue.leaveCurrentVenue.query()">
        Leave current venue
      </XButton>
      <!-- <XButton @click="startTransformStream">
        Subscribe to transforms
      </XButton> -->

    </div>

  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import { loginWithAutoToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';
// import type { AppRouter } from 'mediaserver';
// import { createTRPCProxyClient, wsLink, createWSClient } from '@trpc/client';
import { getClient, startGuestClient, startLoggedInClient } from '@/modules/trpcClient';
import type { ClientTransform, ConnectionId } from 'schemas';
import { useClientStore } from '@/stores/clientStore';
import { getHashes } from 'crypto';

// Stores
const clientStore = useClientStore()

// Server
const venueId = ref<string>('');
const connectionId = ref<ConnectionId>();

const ownedVenues = ref<Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listMyVenues']['query']>>>([]);
const loadedVenues = ref<Awaited<ReturnType<ReturnType<typeof getClient>['venue']['listLoadedVenues']['query']>>>({});

const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});
const slider = ref<number>(0);

const loginAsAdmin = async () => {
  await startLoggedInClient('superadmin', 'bajskorv')
  subToHeartBeat();
  getGreeting();
  getVenuesAll();
  getVenuesLoaded()
}

const getVenuesAll = async () => {
  clientStore.venuesAll = await getClient().venue.listMyVenues.query()
}

const getVenuesLoaded = async () => {
  clientStore.venuesLoaded = await getClient().venue.listLoadedVenues.query()
}

const loadVenue = async (uuid: string) => {
  await getClient().venue.loadVenue.mutate({uuid})
  getVenuesLoaded()
}

const createVenue = async () => {
  await getClient().venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`})
  getVenuesAll()
}

function onSlide(evt: number) {
  slider.value = evt;
  getClient().vr.transforms.updateTransform.mutate({
    position: [slider.value, 0, 0],
    orientation: [0,0,0,0],
  });
}

const subToHeartBeat = () => getClient().subHeartBeat.subscribe(undefined, {
  onData(heartbeat){
    clientStore.heartbeat = heartbeat;
  },
});

const getHealth = async () => {
  clientStore.health = await getClient().health.query();
};

const getGreeting = async () => {
  clientStore.greeting = await getClient().greeting.query();
};

const joinVenue = async (uuid: string) => {
  await getClient().venue.joinVenue.mutate({uuid})
  startTransformStream()
}

let stopTransformStream: () => void;
function startTransformStream() {
  if(stopTransformStream) stopTransformStream();
  const subscription = getClient().vr.transforms.subClientTransforms.subscribe(undefined, {
    onData(data) {
      console.log('received transform data!', data);
      clientStore.positionData = data;
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

  getHealth()
  getGreeting()
  subToHeartBeat()

});

onBeforeUnmount(() => {
  if(stopTransformStream){
    stopTransformStream();
  }
});

</script>

<style scoped>

</style>
