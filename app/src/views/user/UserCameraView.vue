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
    <input
      type="range"
      min="5"
      max="30"
      v-model="cinemaDistance"
    >
    <button
      class="btn btn-xs"
      @click="triggerManualCurtainCheck"
    >
      curtain
    </button>
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
      <a-entity environment="preset: tron; dressing: none;" />
      <!-- <a-sky color="#000" radius="10000" /> -->
      <!-- <a-plane roughness="0.7" material="dithering: true;" color="#aaa" width="10000" height="10000"  rotation="-90 0 0" /> -->
      <a-entity
        ref="cameraRigTag"
        id="rig"
      >
        <a-camera
          ref="cameraTag"
          reverse-mouse-drag="true"
        >
          <a-sky
            visible="true"
            ref="curtainTag"
            radius="0.5"
            material="transparent: true; color: #505; opacity: 0.0; depthTest: false"
            animation__to_black="property: material.opacity; from: 0.0; to: 1.0; dur: 500; startEvents: fadeToBlack"
            animation__from_black="property: material.opacity; from: 1.0; to: 0.0; dur: 500; startEvents: fadeFromBlack"
          />
        </a-camera>
        <a-entity
          laser-controls="hand:left"
          raycaster="objects: .clickable"
        />
        <a-entity
          laser-controls="hand:right"
          raycaster="objects: .clickable"
        />
      </a-entity>
      <a-entity       
        position="0 1.6 0"
        rotation="0 0 0"
        material="depthTest: false"
      >
        <a-entity
          :visible="!persistedCameraStore.is360Camera"
          :position="`0 ${0} -${cinemaDistance}`"
        >
          <a-video
            ref="aVideoTag"
            crossorigin="anonymous"
            :width="fixedWidth"
            :height="videoHeight"
            :rotation="`0 0 ${persistedCameraStore.isRoofMounted?'180': 0}`"
            material="transparent: false; depthTest: false"
          />
          <a-entity
            v-for="portal in persistedCameraStore.portals"
            :key="portal.toCameraId"
            :position="`${(portal.x-0.5)*fixedWidth} ${(portal.y-0.5)*videoHeight} 0`"
          >
            <a-sphere
              hover-highlight
              position="0 0 -0.1"
              color="yellow"
              material="depthTest:false; shader: flat;"
              scale="0.2 0.2 0.2"
              class="clickable"
              @mousedown="goToCamera(portal.toCameraId, $event)"
            />
            <a-text
              value="Teeeext"
              align="center"
              position="0 -1 -1"
              material="depthTest: false"
            />
          </a-entity>
        </a-entity>
        <a-entity
          :visible="persistedCameraStore.is360Camera"
        >
          <a-videosphere
            :geometry="`phiLength:${persistedCameraStore.FOV?.phiLength??360}; phiStart:${persistedCameraStore.FOV?.phiStart??0}`"
            ref="vSphereTag"
            src="#main-video-1"
            :rotation="`0 90 ${persistedCameraStore.isRoofMounted? '180': '0'}`"
            radius="10"
            color="#fff"
            material="color: #fff; depthTest:false; fog: false"
          />
          <a-entity
            v-for="portal in persistedCameraStore.portals"
            :key="portal.toCameraId"
            :rotation="`${portal.angleX} ${portal.angleY} 0`"
          >
            <a-sphere
              material="depthTest: false;"
              :position="`0 0 ${-portal.distance}`"
              scale="0.2 0.2 0.2"
              color="#ef2d5e"
              class="clickable"
              hover-highlight
              @mousedown="goToCamera(portal.toCameraId, $event)"
            />
          </a-entity>
        </a-entity>
      </a-entity>
    </a-scene>
    <div class="flex">
      <div>
        <div class="relative">
          <video
            autoplay
            v-for="n in 2"
            :key="n"
            ref="videoTags"
            :id="`main-video-${n}`"
            :class="{'rotate-180': persistedCameraStore.isRoofMounted}"
            crossorigin="anonymous"
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
import { onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, watch } from 'vue';
import { useVenueStore } from '@/stores/venueStore';
import { useCameraStore } from '@/stores/cameraStore';
import { computedWithControl } from '@vueuse/core';
import 'aframe';
import { THREE, type Entity } from 'aframe';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const router = useRouter();

const videoTags = shallowReactive<HTMLVideoElement[]>([]);
const audioTag = ref<HTMLAudioElement>();

const vSphereTag = ref<Entity>();
// const vSphereRadius = 10;
const aVideoTag = ref<Entity>();
const curtainTag = ref<Entity>();

const cameraTag = ref<Entity>();
const cameraRigTag = ref<Entity>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();
const persistedCameraStore = computedWithControl(()=> undefined, () => {
  console.log('persistedCamera triggered');
  // NOTE: we cant simply wrap the whole camera store in a computedWithControl for some reason I dont have time to look into.
  // Instead we here return the separate parts of the store we actually need
  return {currentCamera: camera.currentCamera, FOV: camera.FOV, portals: camera.portals, is360Camera: camera.is360Camera, isRoofMounted: camera.isRoofMounted };

});
// const persistedPortals = computedWithControl(() => undefined, () => {
//   console.log('computedPortals triggered');
//   return camera.portals;
// });
// const persistedFOV = computedWithControl(() => undefined, () => {
//   return camera.FOV;
// });
// watch(() => camera.producers, async (updatedProducers) => {
  // console.log('cameraProducers were updated:', toRaw(updatedProducers));
  // init();
// });

let activeVideoTagIndex = 1; // Since we switch _before_ retrieving video stream we set initial value to the second videotag so it will switch to first videotag on pageload. Yes, its a bit hacky :-)
const activeVideoTag = shallowRef<HTMLVideoElement>();

async function consumeAndHandleResult() {
  const rcvdTracks = await camera.consumeCurrentCamera();
  ++activeVideoTagIndex;
  activeVideoTagIndex %= 2;
  activeVideoTag.value = videoTags[activeVideoTagIndex];
  const vtag = activeVideoTag.value;
  if(!vtag) return;

  if(!rcvdTracks?.videoTrack && !import.meta.env.DEV ){
    console.error('no videotrack from camera');
    return;
  }
  if(!rcvdTracks?.videoTrack){
    console.warn('falling back to using demo video because we are in dev mode');
    vtag.muted = true;
    vtag.loop = true;
    vtag.srcObject = null;
    vtag.setAttribute('crossorigin', 'anonymous');
    // videoTag.src = 'https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4';
    // videoTag.src = 'https://bitmovin.com/player-content/playhouse-vr/progressive.mp4';
    vtag.src = 'https://video.360cities.net/aeropicture/01944711_VIDEO_0520_1_H264-1920x960.mp4';
  }else{
    vtag.muted = false;
    vtag.loop = false;
    vtag.srcObject = new MediaStream([rcvdTracks.videoTrack]);
  }
  vtag.play();
  vtag.addEventListener('playing', () => {
    console.log('playing event triggered.');
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true});
  if(rcvdTracks?.audioTrack && audioTag.value){
    audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
  }
  
}

let fallbackTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
const overrideIsCurtainReady = ref(false);
function triggerManualCurtainCheck(){
  overrideIsCurtainReady.value = true;
  tryPrepareSceneAndFadeFromBlack();
}
function tryPrepareSceneAndFadeFromBlack(){
  if(videoTags[activeVideoTagIndex].paused
    || isFadingToBlack 
    || isZoomingInOnPortal 
    // || !overrideIsCurtainReady.value
  ){
    console.log('not yet ready to reveal after portal jump. returning');
    // fallbackTimeout = setTimeout(() => {
    //   console.warn('FALLBACK FADE TRIGGERED because we never reached a ready state for curtain animations');
    //   tryPrepareSceneAndFadeFromBlack();
    // }, 20000);
    return;
  }
  // clearTimeout(fallbackTimeout);
  console.log('preparing environment after portal jump');

  persistedCameraStore.trigger();
  console.log('offsetting vieworigin:', camera.viewOrigin);
  cameraRigTag.value?.setAttribute('rotation', `0 ${camera.viewOrigin?.angleY??0} 0`);

  if(!cameraTag.value){
    throw Error('template ref undefined. That should not happen!');
  }
  cameraTag.value.setAttribute('look-controls', {enabled: false});
  // const lookControls = cameraTag.value.components['look-controls'] as unknown as { pitchObject: {rotaion: THREE.Euler}, yawObject: {rotation: THREE.Euler}};
  // lookControls.pitchObject.rotaion.x = 0;
  // lookControls.yawObject.rotation.y = 0;
  // @ts-ignore
  cameraTag.value.components['look-controls'].pitchObject.rotation.x = 0;
  // @ts-ignore
  cameraTag.value.components['look-controls'].yawObject.rotation.y = 0;
  cameraTag.value.setAttribute('look-controls', {enabled: true});

  console.log('Switching v-sphere source');
  vSphereTag.value?.setAttribute('src', `#main-video-${activeVideoTagIndex+1}`);
  // vSphereTag.value?.setAttribute('visible', camera.is360Camera);
  console.log('switching a-video source');
  aVideoTag.value?.setAttribute('src', `#main-video-${activeVideoTagIndex+1}`);
  // aVideoTag.value?.setAttribute('visible', !camera.is360Camera);

  // persistedPortals.trigger();
  // persistedFOV.trigger();

  setVideoDimensionsFromTag(activeVideoTag.value!);
  
  cameraRigTag.value?.object3D.position.set(0,0,0);
  
  overrideIsCurtainReady.value = false;
  
  curtainTag.value?.emit('fadeFromBlack');
}

const cinemaDistance = ref(10);
const fixedWidth = 10;
const videoHeight = ref(1.0);
function setVideoDimensionsFromTag(vTag: HTMLVideoElement){
  const w = vTag.videoWidth;
  const h = vTag.videoHeight;
  console.log(w,h);
  const ratio = w / h;
  videoHeight.value = fixedWidth/ratio;
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
  consumeAndHandleResult();
}
// These will hold to play state of the animations.
let isFadingToBlack = false;
let isZoomingInOnPortal = false;
function goToCamera(cameraId: CameraId, event: Event) {
  videoTags[activeVideoTagIndex].pause();
  isFadingToBlack = true;
  curtainTag.value?.emit('fadeToBlack');
  (curtainTag.value as HTMLElement).addEventListener('animationcomplete__to_black', () => {
    console.log('fade to black animation complete');
    isFadingToBlack = false;
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true});

  // Move/zoom animation -----
  const clickedPortal = event.currentTarget as Entity;
  const portalPos = new THREE.Vector3();
  clickedPortal.object3D.getWorldPosition(portalPos);
  const cameraPos = new THREE.Vector3();
  cameraTag.value?.object3D.getWorldPosition(cameraPos);
  const dir = new THREE.Vector3();
  dir.subVectors(portalPos, cameraPos);//.setLength(vSphereRadius-0.2);
  const animationString = `property: position; to: ${dir.x} ${dir.y} ${dir.z}; dur: 500; easing:easeInQuad;`;
  isZoomingInOnPortal = true;
  cameraRigTag.value?.setAttribute('animation', animationString);
  (cameraRigTag.value as HTMLElement)?.addEventListener('animationcomplete', () => {
    console.log('zoom animation complete');
    isZoomingInOnPortal = false;
    tryPrepareSceneAndFadeFromBlack();
  }, {once: true});
  const sphereShrinkAnimationString = `property: geometry.radius; to: ${dir.length()}; dur: 500; easing: easeInQuad;`;
  vSphereTag.value?.setAttribute('animation', sphereShrinkAnimationString);

  
  console.log('go to new camera:', cameraId);
  router.replace({name: 'userCamera', params: {venueId: props.venueId, cameraId}});
}

onMounted(async () => {
  if(soup.userHasInteracted){
    await loadStuff();
    // persistedCameraStore.trigger();
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
