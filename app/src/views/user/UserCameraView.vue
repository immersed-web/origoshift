<template>
  <div v-if="!soup.userHasInteracted">
    <button
      @click="loadStuff()"
      class="btn btn-primary"
    >
      Starta
    </button>
  </div>
  <div v-else-if="!camera.currentCamera">
    Försöker öppna kameran
  </div>
  <div v-else>
    <h1>Watching camera: {{ props.cameraId }}</h1>
    <div class="flex">
      <div>
        <div class="relative">
          <div
            v-for="portal in portalsWithStyles"
            :key="portal.cameraId"
            :style="portal.style"
            class="absolute z-50 rounded-full w-5 h-5 bg-red-600 -translate-x-1/2 -translate-y-1/2"
            @click="goToCamera(portal.cameraId as CameraId)"
          />
          <video
            autoplay
            ref="videoTag"
          />
        </div>
        <audio
          autoplay
          ref="audioTag"
        />
        <!-- <ConsumerElement
          kind="video"
          :track="receivedTracks.videoTrack"
        /> -->
      </div>
      <pre class="max-w-xl">
      {{ soup.consumers }}
    </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useElementSize } from '@vueuse/core';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const router = useRouter();

const videoTag = ref<HTMLVideoElement>();
const { width, height } = useElementSize(videoTag);
const audioTag = ref<HTMLAudioElement>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();
// const receivedTracks : NonNullable<Awaited<ReturnType<typeof camera.consumeCurrentCamera>>> = reactive({
//   videoTrack: undefined,
//   audioTrack: undefined,
// });

const portalsWithStyles = computed(() => {
  return camera.currentCamera?.portals.map(p => {
    return {
      style: {

        left: Math.trunc(width.value * p.x) + 'px',
        top: Math.trunc(height.value * p.y) + 'px',
      },
      cameraId: p.toCameraId,
    };
  });
});

watch(() => camera.producers, async (updatedProducers) => {
  console.log('cameraProducers were updated:', toRaw(updatedProducers));
  const rcvdTracks = await camera.consumeCurrentCamera();
  if(rcvdTracks){
    // receivedTracks.videoTrack = rcvdTracks.videoTrack;
    if(rcvdTracks.videoTrack && videoTag.value){
      videoTag.value.srcObject = new MediaStream([rcvdTracks.videoTrack]);
    }
    if(rcvdTracks.audioTrack && audioTag.value){
      audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
    }
    // receivedTracks.audioTrack = rcvdTracks.audioTrack;
  }
});

async function loadStuff(){
  soup.userHasInteracted = true;
  if(!venueStore.currentVenue){
    await venueStore.joinVenue(props.venueId);
  }
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();

  await camera.joinCamera(props.cameraId);
  console.log('joined camera');
}

function goToCamera(cameraId: CameraId) {
  console.log('go to new camera:', cameraId);
  router.push({name: 'userCamera', params: {venueId: props.venueId, cameraId}});
}

onMounted(async () => {
  if(soup.userHasInteracted){
    await loadStuff();
  }
});

watch(router.currentRoute, () => {
  loadStuff();
});

onBeforeUnmount(() => {
  console.log('Leaving camera');
  camera.leaveCurrentCamera();
});


</script>
