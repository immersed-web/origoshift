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
          id="fade-to-from-black"
          animation__to_black="property: components.material.material.color; type: color; to: #000; dur: 500; startEvents: fadeToBlack; easing: linear;"
          animation__from_black="property: components.material.material.color; type: color; to: #fff; dur: 500; startEvents: fadeFromBlack; easing: linear;"
        />
      </a-assets>
      <a-entity
        ref="cameraRigTag"
        id="rig"
      >
        <a-camera
          ref="cameraTag"
          reverse-mouse-drag="true"
        />
      </a-entity>
      <a-sky radius="6000" color="#00FF00" />
      <a-entity
        position="0 1.6 0"
        :rotation="`0 ${-camera.viewOrigin?.angleY} 0`"
      >
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
            hover-highlight
            @mousedown="goToCamera(portal.toCameraId, $event)"
          />
          <!-- </a-entity> -->
        </a-entity>
        <a-videosphere
        ref="vSphereTag"
          src="#main-video-1"
          rotation="0 90 0"
          radius="5000"
          material="transparent: true; opacity:1"
        />
      </a-entity>
    </a-scene>
    <div class="flex hidden">
      <div>
        <div class="relative">
          <!-- <div
            v-for="portal in portalsWithStyles"
            :key="portal.cameraId"
            :style="portal.style"
            class="absolute z-50 rounded-full w-5 h-5 bg-red-600 -translate-x-1/2 -translate-y-1/2"
            @click="goToCamera(portal.cameraId as CameraId)"
          /> -->
          <video
            autoplay
            v-for="n in 2"
            :key="n"
            ref="videoTags"
            :id="`main-video-${n}`"
          />
        </div>
        <audio
          autoplay
          ref="audioTag"
        />
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
import { THREE, type Entity } from 'aframe';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const router = useRouter();

const videoTags = reactive<HTMLVideoElement[]>([]);
// const { width, height } = useElementSize(videoTags);
const audioTag = ref<HTMLAudioElement>();

const vSphereTag = ref<Entity>();

const cameraTag = ref<Entity>();
const cameraRigTag = ref<Entity>();

// const xRot = ref(0);
// const yRot = ref(0);
// const zRot = ref(0);

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

let activeVideoTag = 0;
watch(() => camera.producers, async (updatedProducers) => {
  console.log('cameraProducers were updated:', toRaw(updatedProducers));
  const rcvdTracks = await camera.consumeCurrentCamera();
  // const prevVideoTag = videoTags[activeVideoTag];
  // prevVideoTag.pause();
  ++activeVideoTag;
  activeVideoTag %= 2;
  const videoTag = videoTags[activeVideoTag];
  if(!videoTag) return;

  if(!rcvdTracks || !rcvdTracks.videoTrack ){
    console.error('no videotrack from camera');
    if(import.meta.env.DEV){
      console.warn('falling back to using demo video because we are in dev mode');
      videoTag.muted = true;
      videoTag.loop = true;
      videoTag.srcObject = null;
      // videoTag.src = 'https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4';
      // videoTag.src = 'https://bitmovin.com/player-content/playhouse-vr/progressive.mp4';
      videoTag.src = 'https://video.360cities.net/aeropicture/01944711_VIDEO_0520_1_H264-1920x960.mp4';
      videoTag.play();
      vSphereTag.value?.setAttribute('src', '#main-video-1');
    }
    return;
  } else {
    videoTag.muted = false;
    videoTag.loop = false;
    videoTag.srcObject = new MediaStream([rcvdTracks.videoTrack]);
    videoTag.play();
    videoTag.addEventListener('playing', () => {
      console.log('playing event triggered. Switching v-sphere source');
      vSphereTag.value?.setAttribute('src', `#main-video-${activeVideoTag+1}`);
    }, {once: true});
  }
  if(rcvdTracks.audioTrack && audioTag.value){
    audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
  }
  // receivedTracks.audioTrack = rcvdTracks.audioTrack;
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

function goToCamera(cameraId: CameraId, event: Event) {
    // const radius = vSphereTag.value?.components.geometry.radius;
    // console.log('vSphere Radius was: ', radius);
  videoTags[activeVideoTag].pause();
  // cameraTag.value?.emit('zoom', null, false);
  const clickedPortal = event.currentTarget as Entity;
  const portalPos = new THREE.Vector3();
  clickedPortal.object3D.getWorldPosition(portalPos);
  const cameraPos = new THREE.Vector3();
  cameraTag.value?.object3D.getWorldPosition(cameraPos);
  const dir = new THREE.Vector3();
  dir.subVectors(portalPos, cameraPos).setLength(4800);
  const animationString = `property: position; to: ${dir.x} ${dir.y} ${dir.z}; dur: 500; easing:easeInQuad;`;
  cameraRigTag.value?.setAttribute('animation', animationString);
  (<HTMLElement>cameraRigTag.value)?.addEventListener('animationcomplete', () => {
    console.log('position animation complete');
    cameraRigTag.value?.object3D.position.set(0,0,0);
  }, {once: true});
  
  console.log('vSphere:',vSphereTag.value);;
  
  const fadeAnimationString = "property: components.material.material.opacity ;from: 1; to: 0; dur: 500; easing: linear;"
  const testAnimationString = "property: rotation; to: 0 150 0; dur: 500; easing:easeInQuad";
  vSphereTag.value?.setAttribute('animation', fadeAnimationString);

  // vSphereTag.value?.components.material.
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
