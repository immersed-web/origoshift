<template>
  <Teleport
    v-if="domOutlet"
    :to="domOutlet"
  >
    <div
      class="flex justify-center items-center"
      v-if="!soup.userHasInteracted"
    >
      <button
        class="btn btn-primary btn-lg"
        @click="loadStuff"
      >
        Starta
      </button>
    </div>
    <div v-else-if="!camera.currentCamera">
      Försöker öppna kameran
    </div>
  </Teleport>
  <template
    v-if="soup.userHasInteracted && camera.currentCamera"
  >
    <!-- <a-assets>
      <a-mixin
        id="fade-to-from-black"
        animation__to_black="property: components.material.material.color; type: color; to: #000; dur: 500; startEvents: fadeToBlack; easing: linear;"
        animation__from_black="property: components.material.material.color; type: color; to: #fff; dur: 500; startEvents: fadeFromBlack; easing: linear;"
      />
    </a-assets> -->
    <!-- <a-entity
      ref="environmentEntityTag"
      :environment="`preset: tron; dressing: none; active:${!freezeableCameraStore.is360Camera};`"
    /> -->
    <a-sky color="midnightblue" />
    <a-grid :visible="!freezeableCameraStore.is360Camera" />
    <a-entity
      ref="cameraRigTag"
      id="rig"
    >
      <a-camera
        ref="cameraTag"
        reverse-mouse-drag="true"
        :look-controls-enabled="!movedPortalCameraId && !isViewOriginMoved && !cameraIsAnimating"
      >
        <a-sky
          visible="true"
          ref="curtainTag"
          radius="0.5"
          material="transparent: true; color: #505; opacity: 0.0; depthTest: false"
          animation__to_black="property: material.opacity; from: 0.0; to: 1.0; dur: 500; startEvents: fadeToBlack"
          animation__from_black="property: material.opacity; from: 1.0; to: 0.0; dur: 500; startEvents: fadeFromBlack"
        />
        <a-text
          :visible="debugMessage !== '' || debugMessage !== undefined"
          :value="debugMessage"
          position="0.2 0 -2"
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
        v-if="props.editable"
        :rotation="`${camera.viewOrigin?.angleX} ${camera.viewOrigin?.angleY} 0`"
      >
        <a-ring
          radius-inner="0.1"
          radius-outer="0.2"
          position="0 0 -2"
          color="teal"
          hover-highlight
          material="shader: flat; transparent: true; depthTest:false"
        >
          <a-ring
            radius-inner="0"
            radius-outer="0.2"
            color="yellow"
            material="opacity:0; depthTest: false;"
            class="clickable"
            @mousedown="isViewOriginMoved = true"
          />
          <a-text
            material="depthTest:false"
            position="0 -0.3 0"
            value="startvy"
            align="center"
          />
        </a-ring>
      </a-entity>
      <a-entity 
        :visible="!freezeableCameraStore.is360Camera"
        rotation="0 180 0"
      >
        <a-entity
          :position="`0 0 ${-cinemaDistance}`"
        >
          <a-video
            ref="aVideoTag"
            crossorigin="anonymous"
            :width="fixedWidth"
            :height="videoHeight"
            :rotation="`0 0 ${freezeableCameraStore.isRoofMounted?'180': 0}`"
            material="transparent: false; depthTest: true"
          />
          <a-entity
            v-for="portal in freezeableCameraStore.portals"
            :key="portal.toCameraId"
            :position="`${(portal.x-0.5)*fixedWidth} ${(-portal.y+0.5)*videoHeight} 0`"
          >
            <a-sphere
              hover-highlight
              position="0 0 -0.1"
              color="yellow"
              material="depthTest: true; shader: flat;"
              scale="0.2 0.2 0.2"
              class="clickable"
              @mousedown="onPortalMouseDown(portal, $event)"
            />
            <a-text
              value="Teeeext"
              align="center"
              position="0 -0.4 0"
              material="depthTest: true"
            />
          </a-entity>
        </a-entity>
      </a-entity>
      <a-entity
        :visible="freezeableCameraStore.is360Camera"
      >
        <a-videosphere
          :geometry="`phiLength:${freezeableCameraStore.FOV?.phiLength??360}; phiStart:${freezeableCameraStore.FOV?.phiStart??0}`"
          ref="vSphereTag"
          src="#main-video-1"
          :rotation="`0 90 ${freezeableCameraStore.isRoofMounted? '180': '0'}`"
          radius="10"
          color="#fff"
          material="color: #fff; depthTest:true; fog: false"
        />
        <a-entity
          v-for="portal in freezeableCameraStore.portals"
          :key="portal.toCameraId"
          :rotation="`${portal.angleX} ${portal.angleY} 0`"
        >
          <a-sphere
            material="depthTest: true;"
            :position="`0 0 ${-portal.distance}`"
            scale="0.2 0.2 0.2"
            color="#ef2d5e"
            class="clickable"
            hover-highlight
            @mousedown="onPortalMouseDown(portal, $event)"
          />
        </a-entity>
      </a-entity>
    </a-entity>
  </template>
  <div class="hidden">
    <div class="">
      <video
        autoplay
        v-for="n in 2"
        :key="n"
        ref="videoTags"
        :id="`main-video-${n}`"
        :class="{'rotate-180': freezeableCameraStore.isRoofMounted}"
        crossorigin="anonymous"
      />
    </div>
    <audio
      autoplay
      ref="audioTag"
    />
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, watch, inject } from 'vue';
import { computedWithControl } from '@vueuse/core';
import { useVenueStore } from '@/stores/venueStore';
import { useCameraStore } from '@/stores/cameraStore';
import { THREE, type Entity, type Scene } from 'aframe';
import { useAdminStore } from '@/stores/adminStore';
// import { useAutoEnterXR } from '@/composables/autoEnterXR';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';

const props = withDefaults(defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
  editable?: boolean
}>(), {
  editable: false,
});

defineExpose({
  createOrCenterOnPortal,
});

defineOptions({
  inheritAttrs: false,
});

const { domOutlet, sceneTag } = inject(aFrameSceneProvideKey)!;

const router = useRouter();

const videoTags = shallowReactive<HTMLVideoElement[]>([]);
const audioTag = ref<HTMLAudioElement>();

// const sceneTag = ref<Scene>();
// useAutoEnterXR(sceneTag);
const vSphereTag = ref<Entity>();
const aVideoTag = ref<Entity>();
const curtainTag = ref<Entity>();
const environmentEntityTag = ref<Entity>();

const cameraTag = ref<Entity>();
const cameraRigTag = ref<Entity>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();

const debugMessage = ref<string>();

// we have some tricks so the (derived) camerastore temporarily ignores updates while teleporting. after teleportation we trigger it and starts reacting to updates again.
const freezeCameraState = ref(false);
watch([camera, freezeCameraState], () => {
  if(!freezeCameraState.value) {
    freezeableCameraStore.trigger();
  }
});
const freezeableCameraStore = computedWithControl(()=> undefined, () => {
  // console.log('persistedCamera triggered');
  // NOTE: we cant simply wrap the whole camera store in a computedWithControl for some reason I dont have time to look into.
  // Instead we here return the separate parts of the store we actually need
  return {currentCamera: camera.currentCamera, FOV: camera.FOV, portals: camera.portals, is360Camera: camera.is360Camera, isRoofMounted: camera.isRoofMounted };
});

let activeVideoTagIndex = 1; // Since we switch _before_ retrieving video stream we set initial value to the second videotag so it will switch to first videotag on pageload. Yes, its a bit hacky :-)
const activeVideoTag = shallowRef<HTMLVideoElement>();

async function consumeAndHandleResult() {
  activeVideoTag.value?.pause();
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
    // console.log('playing event triggered.');
    onCurtainStateChanged();
  }, {once: true});
  if(rcvdTracks?.audioTrack && audioTag.value){
    audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
  }
  
}

let fallbackTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
function onCurtainStateChanged() {
  if(videoTags[activeVideoTagIndex].paused
    || isFadingToBlack 
    || isZoomingInOnPortal 
  ){
    // console.log('not yet ready to reveal after portal jump. returning');
    clearTimeout(fallbackTimeout);
    fallbackTimeout = setTimeout(() => {
      console.warn('FALLBACK FADE TRIGGERED because we never reached a ready state for curtain animations');
      prepareSceneAndFadeFromBlack();
    }, 7000);
    return;
  }
  clearTimeout(fallbackTimeout);
  prepareSceneAndFadeFromBlack();
}

function prepareSceneAndFadeFromBlack(){
  console.log('preparing environment after portal jump');

  // manuallyThrottledCameraStore.trigger();
  // resumeCameraWatcher();
  freezeCameraState.value = false;
  // console.log('offsetting vieworigin:', camera.viewOrigin);
  if(props.editable){
    cameraRigTag.value?.setAttribute('rotation', '0 0 0');
    setCameraRotation(camera.viewOrigin!.angleX, camera.viewOrigin!.angleY);
  } else {
    cameraRigTag.value?.setAttribute('rotation', `0 ${camera.viewOrigin?.angleY??0} 0`);
    setCameraRotation(0,0);
  }

  // console.log('Switching v-sphere source');
  vSphereTag.value?.setAttribute('src', `#main-video-${activeVideoTagIndex+1}`);
  // console.log('switching a-video source');
  aVideoTag.value?.setAttribute('src', `#main-video-${activeVideoTagIndex+1}`);

  setVideoDimensionsFromTag(activeVideoTag.value!);
  
  cameraRigTag.value?.object3D.position.set(0,0,0);
  
  curtainTag.value?.emit('fadeFromBlack');
}

const cinemaDistance = ref(10);
const fixedWidth = 10;
const videoHeight = ref(1.0);
function setVideoDimensionsFromTag(vTag: HTMLVideoElement){
  const w = vTag.videoWidth;
  const h = vTag.videoHeight;
  // console.log(w,h);
  const ratio = w / h;
  videoHeight.value = fixedWidth/ratio;
}

async function loadStuff(){
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

type ComputedPortal = Exclude<typeof camera.portals, undefined>[CameraId]
function onPortalMouseDown(portal: ComputedPortal, evt: MouseEvent){
  if(props.editable){
    // Start entity move
    movedPortalCameraId.value = portal.toCameraId;
    console.log('clicked portal while in edit mode');
  } else {
    // teleport
    teleportToCamera(portal.toCameraId, evt);
  }
}
// These will hold the play state of the animations.
let isFadingToBlack = false;
let isZoomingInOnPortal = false;
function teleportToCamera(cameraId: CameraId, event: Event) {
  // pauseCamerawatcher();
  freezeCameraState.value = true;
  isFadingToBlack = true;
  curtainTag.value?.emit('fadeToBlack');
  (curtainTag.value as HTMLElement).addEventListener('animationcomplete__to_black', () => {
    // console.log('fade to black animation complete');
    isFadingToBlack = false;
    onCurtainStateChanged();
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
    // console.log('zoom animation complete');
    isZoomingInOnPortal = false;
    onCurtainStateChanged();
  }, {once: true});
  const sphereShrinkAnimationString = `property: geometry.radius; to: ${dir.length()}; dur: 500; easing: easeInQuad;`;
  vSphereTag.value?.setAttribute('animation', sphereShrinkAnimationString);

  
  console.log('go to new camera:', cameraId);
  router.replace({name: 'userCamera', params: {venueId: props.venueId, cameraId}});
}

const cameraIsAnimating = ref(false);
async function createOrCenterOnPortal(cameraId:CameraId){
  if(!camera.portals || !camera.currentCamera) return;
  const foundPortal = camera.portals[cameraId];
  const cTag = cameraTag.value;
  if(!cTag){
    console.error('cameraTag ref not set');
    return;
  }
  if(foundPortal){
    console.log('portal already exists');
    cameraIsAnimating.value = true;
    // cTag.setAttribute('look-controls', {enabled: false});

    // enforce y angle is in the range 0 - 360
    // js %-operator is remainder operator and not true modulus. I.E. it doesnt wrap negative input.
    const rot = cTag.object3D.rotation;
    const twoPI = 2 * Math.PI;
    rot.y = THREE.MathUtils.euclideanModulo(rot.y, twoPI);

    const toDegrees = THREE.MathUtils.radToDeg;
    // hack to make sure rotation animation takes shortest path. aframe doesnt handle this for us so we must make sure ourselves.
    const angleDelta = foundPortal.angleY - toDegrees(rot.y);
    // console.log('angleDelta:', angleDelta);
    if(Math.abs(angleDelta) > 180){
      // console.log('from rotation  was tweaked');
      rot.y += twoPI * Math.sign(angleDelta);
    }
    const rotationString = `property: rotation; from: ${toDegrees(rot.x)} ${toDegrees(rot.y)} 0; to: ${foundPortal.angleX} ${foundPortal.angleY} 0;`;
    // console.log('rotationString:', rotationString);
    cTag.setAttribute('animation', rotationString);

    (cTag as HTMLElement).addEventListener('animationcomplete', () => {
      if(!cTag) return;
      const newRotation = cTag.getAttribute('rotation');
      // @ts-ignore
      cTag.components['look-controls'].pitchObject.rotation.x = THREE.MathUtils.degToRad(newRotation.x);
      // @ts-ignore
      cTag.components['look-controls'].yawObject.rotation.y = THREE.MathUtils.degToRad(newRotation.y);
      // cTag.setAttribute('look-controls', {enabled: true});
      cTag.removeAttribute('animation');
      cameraIsAnimating.value = false;
    }, {once: true});
  }else{
    // Create a new portal
    const cameraRotation = cTag.object3D.rotation;
    const portalCoords = camera.utils.anglesToCoords({angleX: THREE.MathUtils.radToDeg(cameraRotation.x), angleY: THREE.MathUtils.radToDeg(cameraRotation.y)});
    console.log(portalCoords);
    const adminStore = useAdminStore();
    adminStore.setPortal({
      cameraId: camera.currentCamera.cameraId,
      toCameraId: cameraId,
      portal: {
        distance: 4,
        x: portalCoords.x,
        y: portalCoords.y,
      },
    });
  }
}

function setCameraRotation(angleX: number, angleY: number){
  if(!cameraTag.value) return;
  const cTag = cameraTag.value;
  cTag.setAttribute('look-controls', {enabled: false});
  // @ts-ignore
  cTag.components['look-controls'].pitchObject.rotation.x = THREE.MathUtils.degToRad(angleX);
  // @ts-ignore
  cTag.components['look-controls'].yawObject.rotation.y = THREE.MathUtils.degToRad(angleY);
  cTag.setAttribute('look-controls', {enabled: true});
}

watch(() => props.cameraId, () => {
  console.log('cameraId updated');
  loadStuff();
});

onMounted(async () => {
  console.log('mounted');

  sceneTag.value?.setAttribute('raycaster', {objects: '.clickable'});
  sceneTag.value?.setAttribute('cursor', {fuse:false, rayOrigin: 'mouse'});
  sceneTag.value?.setAttribute('xr-mode-ui', {enabled: !props.editable});

  // WebXR Immersive navigation handler.
  if (navigator.xr && navigator.xr.addEventListener) {
    console.log('listening to sessiongranted');
    navigator.xr.addEventListener('sessiongranted', function () {
      debugMessage.value = 'session granted!!!';
    });
  }
  await loadStuff();
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('pointermove', onMouseMove);
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('pointermove', onMouseMove);
  if(camera.currentCamera){
    console.log('Leaving camera');
    camera.leaveCurrentCamera();
  }
  environmentEntityTag.value?.setAttribute('environment', 'active', false);
  
});


const movedPortalCameraId = ref<CameraId>();
let isViewOriginMoved = ref(false);
// TODO: Perhaps calculate pixelToRayAngles to make the objects forllow mouse correctly
// Can perhaps somehow be achieved by using the raycaster provided by the cursor component, or building our own component.
function onMouseMove(ev: MouseEvent){
  const xSpeed = 0.0004;
  const ySpeed = 0.0008;
  // console.log(ev);
  if(!camera.currentCamera) return;
  if (isViewOriginMoved.value){
    const newX = camera.currentCamera.viewOrigin.x + ev.movementX * xSpeed;
    camera.currentCamera.viewOrigin.x = (1.0 + newX) % 1.0;
    camera.currentCamera.viewOrigin.y += ev.movementY * ySpeed;
  } else
    if(movedPortalCameraId.value) {
      const newX = camera.currentCamera.portals[movedPortalCameraId.value].x + ev.movementX * xSpeed;
      camera.currentCamera.portals[movedPortalCameraId.value].x = (1.0 + newX) % 1.0;
      camera.currentCamera.portals[movedPortalCameraId.value].y += ev.movementY * ySpeed;
    }
}

function onMouseUp(evt: Event){
  if(!(evt instanceof MouseEvent) || !props.editable) return;
  const adminStore = useAdminStore();

  console.log('mouseup', evt);
  if(movedPortalCameraId.value && camera.currentCamera){
    const {toCameraId, ...portal} = camera.currentCamera.portals[movedPortalCameraId.value];
    const data = {
      cameraId: camera.currentCamera.cameraId,
      toCameraId,
      portal,
    };
    console.log('setting portal:', data);
    adminStore.setPortal(data);
  } else if(isViewOriginMoved.value) {
    adminStore.updateCamera(camera.currentCamera!.cameraId, {viewOriginX: camera.currentCamera?.viewOrigin.x, viewOriginY: camera.currentCamera?.viewOrigin.y }, 'view origin');
  }
  movedPortalCameraId.value = undefined;
  isViewOriginMoved.value = false;
}

</script>