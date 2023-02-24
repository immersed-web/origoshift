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
          :key="venue.venueId"
        >
          <p>{{ venue.name }}</p>
          <XButton
            size="xs"
            @click="loadVenue(venue.venueId)"
          >
            Load
          </XButton>
          <XButton
            class="ml-2"
            color="red"
            size="xs"
            @click="async () => await client.venue.deleteVenue.mutate({venueId: venue.venueId})"
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
          :key="venue.name"
        >
          <p>{{ venue.name }}: {{ venue.venueId }}</p>
          <XButton
            size="xs"
            class="ml-2"
            @click="joinVenue(venue.venueId)"
          >
            Join
          </XButton>
        </div>
      </div>
      <XButton
        @click="async () => await client.vr.openVrSpace.mutate()"
      >
        OpenVr
      </XButton>
      <XButton @click="async () => await client.vr.enterVrSpace.mutate()">
        Enter vrSpace
      </XButton>
      <XButton @click="async () => await client.venue.leaveCurrentVenue.query()">
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
import { client, startLoggedInClient, type RouterOutputs } from '@/modules/trpcClient';
import type { ClientTransform, ConnectionId } from 'schemas';
import { useClientStore } from '@/stores/clientStore';
import type { Unsubscribable } from '@trpc/server/observable';
// import type {  } from '@trpc/server/observable';

// Stores
const clientStore = useClientStore();

// Server
const venueId = ref<string>('');
const connectionId = ref<ConnectionId>();

const ownedVenues = ref<RouterOutputs['venue']['listMyVenues']>([]);
const loadedVenues = ref<RouterOutputs['venue']['listLoadedVenues']>({});

const health = ref<string>('');
const greeting = ref<string>('');
const positionData = ref({});
const slider = ref<number>(0);

const loginAsAdmin = async () => {
  await startLoggedInClient('superadmin', 'bajskorv');
  subToHeartBeat();
  getGreeting();
  getVenuesAll();
  getVenuesLoaded();
};

const getVenuesAll = async () => {
  clientStore.venuesAll = await client.value.venue.listMyVenues.query();
};

const getVenuesLoaded = async () => {
  clientStore.venuesLoaded = await client.value.venue.listLoadedVenues.query();
};

const loadVenue = async (venueId: string) => {
  await client.value.venue.loadVenue.mutate({venueId: venueId});
  getVenuesLoaded();
};

const createVenue = async () => {
  await client.value.venue.createNewVenue.mutate({name: `venue-${Math.trunc(Math.random() * 1000)}`});
  getVenuesAll();
};

function onSlide(evt: number) {
  slider.value = evt;
  client.value.vr.transforms.updateTransform.mutate({
    position: [slider.value, 0, 0],
    orientation: [0,0,0,0],
  });
}

const subToHeartBeat = () => client.value.subHeartBeat.subscribe(undefined, {
  onData(heartbeat){
    clientStore.heartbeat = heartbeat;
  },
});

const getHealth = async () => {
  clientStore.health = await client.value.health.query();
};

const getGreeting = async () => {
  clientStore.greeting = await client.value.greeting.query();
};

const joinVenue = async (venueId: string) => {
  await client.value.venue.joinVenue.mutate({venueId});
  startTransformSubscription();
};

let transformSubscription: Unsubscribable | undefined = undefined;
function startTransformSubscription() {
  if(transformSubscription){
    transformSubscription.unsubscribe();
  }
  transformSubscription = client.value.vr.transforms.subClientTransforms.subscribe(undefined, {
    onData(data) {
      console.log('received transform data!', data);
      clientStore.clientTransforms = data;
      for(const [k, t] of Object.entries(data) as [ConnectionId, ClientTransform][]){
        if(k !== connectionId.value){
          slider.value = t.position[0];
        }
      }
    },
  });
}

onMounted(async () => {
  connectionId.value = await client.value.getConnectionId.query();
  console.log(connectionId.value);

  client.value.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      console.log(data);
    },
  });

  getHealth();
  getGreeting();
  subToHeartBeat();
});

onBeforeUnmount(() => {
  transformSubscription?.unsubscribe();
});

</script>

<style scoped>

</style>
