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
        <a-entity laser-controls="hand:left" raycaster="objects: .clickable" />
        <a-entity laser-controls="hand:right" raycaster="objects: .clickable" />
      </a-entity>
      <a-entity       
        position="0 1.6 0"
        rotation="0 0 0"
      >
        <a-entity
          v-for="portal in persistedPortals"
          :key="portal.toCameraId"
          :rotation="`${portal.angleX} ${portal.angleY} 0`"
        >
          <a-sphere
            :position="`0 0 ${-portal.distance}`"
            scale="0.2 0.2 0.2"
            color="#ef2d5e"
            class="clickable"
            hover-highlight
            @mousedown="goToCamera(portal.toCameraId, $event)"
          />
        </a-entity>
        <a-videosphere
          :geometry="`phiLength:${camera.FOV?.phiLength??360}; phiStart:${camera.FOV?.phiStart??0}`"
          ref="vSphereTag"
          src="#main-video-1"
          rotation="0 90 0"
          radius="5000"
          mixin="fade-to-from-black"
        />
      </a-entity>
    </a-scene>
    <div class="flex hidden">
      <div>
        <div class="relative">
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
import { useElementSize, computedWithControl } from '@vueuse/core';
import 'aframe';
import { THREE, type Entity, type Animation } from 'aframe';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const router = useRouter();

const videoTags = reactive<HTMLVideoElement[]>([]);
const audioTag = ref<HTMLAudioElement>();

const vSphereTag = ref<Entity>();

const cameraTag = ref<Entity>();
const cameraRigTag = ref<Entity>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();
const persistedPortals = computedWithControl(() => undefined, () => {
  console.log('computedPortals triggered');
  return camera.portals;
});

let activeVideoTag = 1; // Since we switch _before_ retrieving video stream we set initial value to the second videotag so it will switch to first videotag on pageload. Yes, its a bit hacky :-)
watch(() => camera.producers, async (updatedProducers) => {
  // console.log('cameraProducers were updated:', toRaw(updatedProducers));
  const rcvdTracks = await camera.consumeCurrentCamera();
  ++activeVideoTag;
  activeVideoTag %= 2;
  const videoTag = videoTags[activeVideoTag];
  if(!videoTag) return;

  if(!rcvdTracks?.videoTrack && !import.meta.env.DEV ){
    console.error('no videotrack from camera');
    return;
  }
  if(!rcvdTracks?.videoTrack){
    console.warn('falling back to using demo video because we are in dev mode');
    videoTag.muted = true;
    videoTag.loop = true;
    videoTag.srcObject = null;
    videoTag.setAttribute('crossorigin', 'anonymous');
    // videoTag.src = 'https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4';
    // videoTag.src = 'https://bitmovin.com/player-content/playhouse-vr/progressive.mp4';
    videoTag.src = 'https://video.360cities.net/aeropicture/01944711_VIDEO_0520_1_H264-1920x960.mp4';
  }else{
    videoTag.muted = false;
    videoTag.loop = false;
    videoTag.srcObject = new MediaStream([rcvdTracks.videoTrack]);
  }
  videoTag.play();
  videoTag.addEventListener('playing', () => {
    console.log('playing event triggered.');
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true});
  if(rcvdTracks?.audioTrack && audioTag.value){
    audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
  }
});

function tryPrepareSceneAndFadeFromBlack(){
  if(videoTags[activeVideoTag].paused || isFadingToBlack || isZoomingInOnPortal){
    console.log('not yet ready to reveal after portal jump. returning');
    return
  }
  console.log('preparing environment after portal jump');
  console.log('offsetting vieworigin:', camera.viewOrigin);
  cameraRigTag.value?.setAttribute('rotation', `0 ${camera.viewOrigin?.angleY??0} 0`);

  if(!cameraTag.value){
    throw Error('template ref undefined. That should not happen!');
  }
  
  cameraTag.value.setAttribute('look-controls', {enabled: false});
  cameraTag.value.components['look-controls'].pitchObject.rotation.x = 0;
  cameraTag.value.components['look-controls'].yawObject.rotation.y = 0;
  cameraTag.value.setAttribute('look-controls', {enabled: true});

  console.log('Switching v-sphere source');
  vSphereTag.value?.setAttribute('src', `#main-video-${activeVideoTag+1}`);

  persistedPortals.trigger();
  
  cameraRigTag.value?.object3D.position.set(0,0,0);
  
  vSphereTag.value?.emit('fadeFromBlack');
}

async function loadStuff(){
  soup.userHasInteracted = true;
  if(!venueStore.currentVenue){
    await venueStore.loadAndJoinVenue(props.venueId);
  }
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();

  await camera.joinCamera(props.cameraId);
  console.log('joined camera');
}

// These will hold to play state of the animations.
let isFadingToBlack = false;
let isZoomingInOnPortal = false;
function goToCamera(cameraId: CameraId, event: Event) {
  videoTags[activeVideoTag].pause();
  isFadingToBlack = true;
  vSphereTag.value?.emit('fadeToBlack');
  (<HTMLElement>vSphereTag.value)?.addEventListener('animationcomplete__to_black', () => {
    console.log('fade to black animation complete');
    isFadingToBlack = false;
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true})

  // Move/zoom animation -----
  const clickedPortal = event.currentTarget as Entity;
  const portalPos = new THREE.Vector3();
  clickedPortal.object3D.getWorldPosition(portalPos);
  const cameraPos = new THREE.Vector3();
  cameraTag.value?.object3D.getWorldPosition(cameraPos);
  const dir = new THREE.Vector3();
  dir.subVectors(portalPos, cameraPos).setLength(4800);
  const animationString = `property: position; to: ${dir.x} ${dir.y} ${dir.z}; dur: 500; easing:easeInQuad;`;
  isZoomingInOnPortal = true;
  cameraRigTag.value?.setAttribute('animation', animationString);
  (<HTMLElement>cameraRigTag.value)?.addEventListener('animationcomplete', () => {
    console.log('zoom animation complete');
    isZoomingInOnPortal = false;
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true});

  
  console.log('go to new camera:', cameraId);
  router.replace({name: 'userCamera', params: {venueId: props.venueId, cameraId}});
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
