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
    <input
      type="range"
      max="360"
      min="-360"
      v-model="xRot"
    >
    <input
      type="range"
      max="360"
      min="-360"
      v-model="yRot"
    >
    <input
      type="range"
      max="360"
      min="-360"
      v-model="zRot"
    >
    <a-scene
      class="w-screen h-screen"
      embedded
    >
      <a-camera reverse-mouse-drag="true" />
      <a-box
        position="-1 0.5 -3"
        rotation="0 45 0"
        color="#4CC3D9"
      />
      <a-sphere
        position="0 1.25 -5"
        radius="1.25"
        color="#EF2D5E"
      />
      <a-cylinder
        position="1 0.75 -3"
        radius="0.5"
        height="1.5"
        color="#FFC65D"
      />
      <a-plane
        position="0 0 -4"
        rotation="-90 0 0"
        width="4"
        height="4"
        color="#7BC8A4"
      />
      <a-sky color="#ECECEC" />
      <a-box
        position="-1 0.5 -3"
        rotation="0 45 0"
        color="#4CC3D9"
      />
      <a-entity
        v-for="portal in portalsWithStyles"
        :key="portal.cameraId"
        :rotation="`${xRot} ${yRot} ${zRot}`"
      >
        <!-- :rotation="`${90-180*parseFloat(portal.style.top)} 0 0`" -->
        <a-sphere
          position="10 0 0"
          color="#ef2d5e"
        />
      </a-entity>
      <a-videosphere />
    </a-scene>
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
            id="main-video"
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
import 'aframe';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const router = useRouter();

const videoTag = ref<HTMLVideoElement>();
const { width, height } = useElementSize(videoTag);
const audioTag = ref<HTMLAudioElement>();

const xRot = ref(0);
const yRot = ref(0);
const zRot = ref(0);

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
      const vSphere = document.querySelector('a-videosphere');
      // vSphere.setAttribute('srcObject', 'https://bitmovin.com/player-content/playhouse-vr/progressive.mp4');
      vSphere.setAttribute('src', '#main-video');
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
