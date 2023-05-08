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
    <!-- <h1>Watching camera: {{ props.cameraId }}</h1> -->
    <!-- <label>
      <input
        type="range"
        max="360"
        min="-360"
        v-model="xRot"
      >
      {{ xRot }}
    </label>
    <label>
      <input
        type="range"
        max="360"
        min="-360"
        v-model="yRot"
      >
      {{ yRot }}
    </label>
    <label>
      <input
        type="range"
        max="360"
        min="-360"
        v-model="zRot"
      >
      {{ zRot }}
    </label> -->
    <!-- <label>
      <input
        class="w-56"
        type="range"
        max="1"
        min="0"
        step="0.01"
        v-model="camera.currentCamera.portals[0].x"
      >
      {{ camera.currentCamera.portals[0].x }}
    </label>
    <label>
      <input
        class="w-56"
        type="range"
        max="1"
        min="0"
        step="0.01"
        v-model="camera.currentCamera.portals[0].y"
      >
      {{ camera.currentCamera.portals[0].y }}
    </label> -->
    <a-scene
      class="w-full h-screen"
      embedded
      cursor="rayOrigin: mouse; fuse: false;"
      raycaster="objects: .clickable"
    >
      <a-assets>
        <a-mixin
          id="cursorHighlight"
          animation__scale="property: scale; to: 1.1 1.1 1.1; dur: 100; startEvents: mouseenter"
          animation__scale_reverse="property: scale; to: 1 1 1; dur: 200; startEvents: mouseleave"
        />
      </a-assets>
      <a-camera reverse-mouse-drag="true" />
      <a-sky color="#ECECEC" />
      <a-entity position="0 1.6 0">
        <a-entity
          v-for="portal in camera.portals"
          :key="portal.toCameraId"
          :rotation="`${portal.angleX} ${portal.angleY} 0`"
        >
          <!-- :rotation="`${xRot} ${yRot} ${zRot}`" -->
          <!-- <a-entity
          mixin="cursorHighlight"
          > -->
          <a-sphere
            :position="`0 0 ${-portal.distance}`"
            scale="0.2 0.2 0.2"
            color="#ef2d5e"
            class="clickable"
            @mousedown="goToCamera(portal.toCameraId)"
          />
          <!-- </a-entity> -->
        </a-entity>
      </a-entity>
      <a-videosphere />
    </a-scene>
    <div class="flex hidden">
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

// const portalsWithStyles = computed(() => {
//   return camera.currentCamera?.portals.map(p => {
//     const angleY = -360 * p.x + -90; 
//     const angleZ = 90 - (180 * p.y);
//     return {
//       style: {

//         left: Math.trunc(width.value * p.x) + 'px',
//         top: Math.trunc(height.value * p.y) + 'px',
//       },
//       cameraId: p.toCameraId,
//       x: p.x,
//       y: p.y,
//       distance: p.distance,
//       angleY,
//       angleZ,
//     };
//   });
// });

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
