<template>
  <div class="grid lg:place-items-center h-screen">
    <div class="card bg-base-200 p-6">
      <h1 class="text-5xl font-bold mb-8">
        {{ venueStore.currentVenue?.name??$props.venueId }}
      </h1>

      <div v-if="!venueStore.currentVenue">
        <h2>Försöker ansluta till evented</h2>
      <!-- <div>
        <div
          role="alert"
          class="alert alert-warning mb-4"
        >
          <span class="material-icons">
            warning
          </span>
          Eventet är inte igång.
        </div>
        <h2>Eventets hålltider</h2>
        <p v-if="venueInfo?.doorsOpeningTime">
          <strong>Lobbyn öppnar:</strong> {{ venueInfo.doorsOpeningTime.toLocaleString() }}
        </p>
        <p v-if="venueInfo?.streamStartTime">
          <strong>Sändningen startar:</strong> {{ venueInfo.streamStartTime.toLocaleString() }}
        </p>

        <p v-if="venueInfo?.doorsOpeningTime && !isPast(venueInfo.doorsOpeningTime)">
          Behåll denna sida öppen för att automatiskt slussas in i eventet när det startar.
        </p>
      </div> -->
      </div>
      <div
        v-else
      >
        <div class="flex gap-2 lg:gap-12">
          <div class="flex-1">
            <div v-if="venueStore.currentVenue.vrSpace">
              <h2 class="mb-2">
                VR-lobby
              </h2>

              <p class="my-2">
                <span
                  class="material-icons text-sm"
                  :class="venueStore.doorsAreOpen ? 'text-green-500' : 'text-red-500'"
                >circle</span>
                <strong>Lobbyn är {{ venueStore.doorsAreOpen ? 'öppen' : 'stängd' }}</strong>
              </p>

              <div v-if="venueStore.secondsUntilDoorsOpen == 0">
                <p>Gå in i eventets VR-lobby och träffa andra besökare till detta event. Du kan använda ett VR-headset eller mus och tangentbord.</p>
                <button
                  class="btn btn-primary"
                  @click="openLobby"
                >
                  Gå in i VR-lobby
                </button>
              </div>
              <div v-else-if="venueStore.currentVenue.doorsOpeningTime">
                <strong>Lobbyn öppnar:</strong> {{ venueStore.currentVenue.doorsOpeningTime?.toLocaleString() }}
                <p
                  v-if="venueStore.secondsUntilDoorsOpen !== undefined"
                  class="max-w-96"
                >
                  Du slussas automatiskt in i lobbyn när den öppnar om <span class="font-black">{{ timeLeftString }}</span>
                </p>
              </div>
            </div>
          </div>
          <div class="flex-1">
            <h2 class="mb-2">
              360-ström
            </h2>
            <p class="my-2">
              <span
                class="material-icons text-sm"
                :class="venueStore.streamIsActive ? 'text-green-500' : 'text-red-500'"
              >circle</span>
              <strong>Sändningen är {{ venueStore.streamIsActive ? 'igång' : 'ej igång' }}</strong>
            </p>

            <div v-if="venueStore.streamIsActive">
              <button
                @click="goToStream"
                class="btn btn-primary"
              >
                Gå till kameraström
              </button>
            </div>
            <div v-else-if="venueStore.currentVenue.streamStartTime">
              <strong>Sändningen startar:</strong> {{ venueStore.currentVenue.streamStartTime?.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
// import { useConnectionStore } from '@/stores/connectionStore';
import type { VenueId } from 'schemas';
import { computed, onMounted, watch } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
import { useIntervalFn } from '@vueuse/core';
// const connection = useConnectionStore();
const venueStore = useVenueStore();

const props = defineProps<{
  venueId: VenueId
}>();

// const venueInfo = shallowRef<VenueListInfo>();

if(venueStore.currentVenue?.venueId !== props.venueId){
  const { pause } = useIntervalFn(async () => {
    try {
      console.log('trying to join venue:', props.venueId);
      // await venueStore.joinVenue(props.venueId);
      await venueStore.loadAndJoinVenue(props.venueId);
      pause();
    }catch(e){
      console.error(e);
      console.log('failed to join venue. Will retry soon.');
    }

  }, 5000, { immediateCallback: true});
}

onMounted(async () =>{
  // venueInfo.value = await connection.client.venue.getVenueListInfo.query({venueId: props.venueId});
});

const timeLeftString = computed(() => {
  if(venueStore.secondsUntilDoorsOpen === undefined) return undefined;
  if(venueStore.secondsUntilDoorsOpen < 60) return `${venueStore.secondsUntilDoorsOpen} sekunder`;
  const minutes = Math.trunc(venueStore.secondsUntilDoorsOpen / 60);
  return `${ minutes } ${minutes > 2 ?'minuter':'minut'}`;
});

watch(() => venueStore.secondsUntilDoorsOpen, (secondsLeft) => {
  console.log('doorsAreOpen changed', secondsLeft);
  if(secondsLeft !== undefined && secondsLeft <= 0) {
    openLobby();
  }
});
function goToStream(){
  // router.push({name: 'basicVR'});
  // console.log('sphere clicked');
  if(!venueStore.currentVenue) return;
  let mainCameraId = venueStore.currentVenue.mainCameraId;
  if(!mainCameraId){
    console.warn('No maincamera set. Falling back to using any camera');
    mainCameraId = Object.values(venueStore.currentVenue.cameras)[0].cameraId;
  }
  router.push({
    name: 'userCamera',
    params: {
      venueId: venueStore.currentVenue.venueId,
      cameraId: mainCameraId,
    },
  });
}

const router = useRouter();
const openLobby = async () => {
  router.push({name: 'userLobby'});
};

</script>

