<template>
  <div class="w-full aspect-video bg-base-200">
    <video
      class="hidden"
      ref="videoTag"
      id="main-video"
      autoplay
    />
    <a-scene
      class="w-full h-full"
      embedded
      cursor="rayOrigin: mouse; fuse: false;"
      raycaster="objects: .clickable"
      vr-mode-ui="enabled: false;"
    >
      <a-assets>
        <a-mixin
          id="cursorHighlight"
          animation__scale="property: scale; to: 1.1 1.1 1.1; dur: 100; startEvents: mouseenter"
          animation__scale_reverse="property: scale; to: 1 1 1; dur: 200; startEvents: mouseleave"
        />
      </a-assets>
      <a-entity
        position="0 1.6 0"
      >
        <a-entity ref="startAngleEntity" :rotation="`${camera.viewOrigin?.angleX} ${camera.viewOrigin?.angleY} 0`">
          <a-ring
            radius-inner="0.1"
            radius-outer="0.2"
            position="0 0 -2"
            color="teal"
            hover-highlight
          >
            <a-ring
              radius-inner="0"
              radius-outer="0.2"
              color="yellow"
              material="opacity:0"
              class="clickable"
              @mousedown="movedEntity = startAngleEntity"
            />
          </a-ring>
        </a-entity>
        <a-entity
          ref="portalsEntity"
        >
          <!-- <a-entity
            v-for="(portal, key) in camera.portals"
            :data-portal-id="key"
            :key="key"
            :rotation="`${portal.angleX} ${portal.angleY} 0`"
          >
            <a-box
              :position="`0 0 ${-portal.distance}`"
              scale="0.2 0.2 0.2"
              color="#ef2d5e"
              class="clickable"
              @mousedown="movedPortalCameraId = portal.toCameraId"
            />
          </a-entity> -->
        </a-entity>
      </a-entity>
      <a-camera
        ref="cameraEntity"
        :look-controls-enabled="!movedEntity && !movedPortalCameraId && !cameraIsAnimating"
        reverse-mouse-drag="true"
      />
      <a-videosphere />
    </a-scene>
    <div class="flex flex-row gap-2 justify-center p-4">
      <template
        v-for="listedCamera in camerasWithPortalInfo"
        :key="listedCamera.cameraId"
      >
        <div v-if="listedCamera.cameraId !== camera.currentCamera?.cameraId" class="indicator">
          <span v-if="listedCamera.hasPortal" class="indicator-item badge badge-primary"></span>
          <div 
          class="group card shadow-md bg-neutral text-neutral-content p-4 cursor-pointer grid grid-cols-2 items-center justify-items-center gap-2"
          >
            <div class="col-span-full row-start-1 justify-self-center group-hover:invisible">
              {{ listedCamera.name }}
            </div>
            <button
            @click="createOrCenterOnPortal(listedCamera.cameraId)"
            class="row-start-1 col-start-1 col-span-1 btn btn-square btn-primary opacity-0 group-hover:opacity-100 transition-all duration-300"><span class="material-icons">visibility</span></button>
            <button class="row-start-1 col-start-2 col-span-1 btn btn-square btn-error opacity-0 group-hover:opacity-100 transition-all duration-300"><span class="material-icons">delete</span></button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
// import 'aframe';
import type { CameraId } from 'schemas';
// import { useSoupStore } from '@/stores/soupStore';
import { type Entity, THREE } from 'aframe';
import { useAdminStore } from '@/stores/adminStore';

const videoTag = ref<HTMLVideoElement>();
const cameraEntity = ref<Entity>();
const startAngleEntity = ref<Entity>();
const portalsEntity = ref<Entity>();
const movedPortalCameraId = ref<CameraId>();
const cameraIsAnimating = ref(false);


const camera = useCameraStore();
const adminStore = useAdminStore();
const camerasWithPortalInfo = computed(() => {
  const portalCameraIds = camera.portals? Object.keys(camera.portals) : [];
  console.log('portalCameraIds in computed:', portalCameraIds);
  const camerasWithPortalInfo = [];
  if(!adminStore.adminOnlyVenueState?.cameras) return [];
  for(const [key, cam] of Object.entries(adminStore.adminOnlyVenueState.cameras)){
    // console.log('includes input:', cam.cameraId, portalCameraIds);
    const hasPortal = portalCameraIds.includes(cam.cameraId);
    // console.log('includes result:', hasPortal);
    const newCam = { hasPortal, ...cam}
    camerasWithPortalInfo.push(newCam);
  }
  return camerasWithPortalInfo;
})
// const soup = useSoupStore();

const props = defineProps<{
  cameraId: CameraId
}>();

const movedEntity = ref<Entity>();
function onMouseUp(evt: Event){
  if(!(evt instanceof MouseEvent)) return;

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
  } else if(movedEntity.value) {
    const originCoords = camera.utils.anglesToCoords({angleX: THREE.MathUtils.radToDeg(movedEntity.value.object3D.rotation.x), angleY: THREE.MathUtils.radToDeg(movedEntity.value.object3D.rotation.y)});
    adminStore.setCameraViewOrigin({
      cameraId: props.cameraId,
      origin: {
        originX: originCoords.x,
        originY: originCoords.y,
      } 
    })
  }
  movedPortalCameraId.value = undefined;
  movedEntity.value = undefined;
}
// TODO: Perhaps calculate pixelToRayAngles to make the objects forllow mouse correctly
// Can perhaps somehow be achieved by using the raycaster provided by the cursor component, or building our own component.
function onMouseMove(ev: MouseEvent){
  // console.log(ev);
  if(!camera.currentCamera) return;
  if (movedEntity.value){
    // movedEntity.value.object3D.rotation.reorder('YXZ');
    // movedEntity.value.object3D.rotation.y -= THREE.MathUtils.degToRad(ev.movementX * 0.15);
    // const newZ = movedEntity.value.object3D.rotation.x - THREE.MathUtils.degToRad(ev.movementY * 0.15);
    // movedEntity.value.object3D.rotation.x = THREE.MathUtils.clamp(newZ, -Math.PI / 2, Math.PI / 2);
    const newX = camera.currentCamera.viewOrigin.x + ev.movementX * 0.001;
    camera.currentCamera.viewOrigin.x = (1.0 + newX) % 1.0;
    camera.currentCamera.viewOrigin.y += ev.movementY * 0.001;
  } else if(movedPortalCameraId.value) {
    const newX = camera.currentCamera.portals[movedPortalCameraId.value].x + ev.movementX * 0.001;
    camera.currentCamera.portals[movedPortalCameraId.value].x = (1.0 + newX) % 1.0;
    camera.currentCamera.portals[movedPortalCameraId.value].y += ev.movementY * 0.001;
  }
}
onMounted(() => {
  loadCamera(props.cameraId);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('pointermove', onMouseMove);
});
onUnmounted(() => {
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('pointermove', onMouseMove);
});

async function loadCamera(cameraId: CameraId) {
  console.log('loading camera');
  await camera.joinCamera(cameraId);
  const tracks = await camera.consumeCurrentCamera();
  console.log(tracks);
  if(!videoTag.value){
    return;
  }
  if(!tracks || !tracks.videoTrack ){
    console.error('no tracks received from camera');
    if(import.meta.env.DEV){
      console.warn('falling back to using demo video because we are in dev mode');
      videoTag.value.muted = true;
      videoTag.value.loop = true;
      // videoTag.value.src = 'https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4';
      videoTag.value.src = 'https://video.360cities.net/aeropicture/01944711_VIDEO_0520_1_H264-1920x960.mp4';
      videoTag.value.play();
      const vSphere = document.querySelector('a-videosphere');
      vSphere.setAttribute('src', '#main-video');
    }
    return;
  }
  videoTag.value.srcObject = new MediaStream([tracks.videoTrack]);
  const vSphere = document.querySelector('a-videosphere');
  vSphere.setAttribute('src', '#main-video');
}

async function createOrCenterOnPortal(cameraId: CameraId) {
  if(!camera.portals || !camera.currentCamera) return;
  const foundPortal = camera.portals[cameraId];
  const rotationTarget = cameraEntity.value;
  if(!rotationTarget){
    console.error('rotationTarget ref not set');
    return;
  }
  if(foundPortal){
    console.log('portal already exists');
    cameraIsAnimating.value = true;
    rotationTarget.setAttribute('look-controls', {enabled: false});
    const fromRotation = rotationTarget.getAttribute('rotation');
    const angleZ = fromRotation.z;
    const to = [foundPortal.angleX, foundPortal.angleY, angleZ];
    rotationTarget.setAttribute('animation', `property: rotation; to: ${to[0]} ${to[1]} ${0};`);
    
    console.log('animating camera:', fromRotation, to);
    
    (<HTMLElement>rotationTarget).addEventListener('animationcomplete', () => {
      if(!rotationTarget) return;
      const newRotation = rotationTarget.getAttribute('rotation');
      rotationTarget.components['look-controls'].pitchObject.rotation.x = THREE.MathUtils.degToRad(newRotation.x);
      rotationTarget.components['look-controls'].yawObject.rotation.y = THREE.MathUtils.degToRad(newRotation.y);
      rotationTarget.setAttribute('look-controls', {enabled: true});
      rotationTarget.removeAttribute('animation');
      cameraIsAnimating.value = false;
    }, {once: true});
  }else{
    // Create a new portal
    const cameraRotation = rotationTarget.object3D.rotation;
    const portalCoords = camera.utils.anglesToCoords({angleX: THREE.MathUtils.radToDeg(cameraRotation.x), angleY: THREE.MathUtils.radToDeg(cameraRotation.y)});
    console.log(portalCoords);
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

// NOTE: Not completely sure why we have to do this. Using vue to v-for over the portals didnt work for some reason.
function manuallyUpdatePortals () {
  if(!camera.portals || !portalsEntity.value) return;
  const allPortalEntities = portalsEntity.value.children
  for (let i = 0; i < allPortalEntities.length; i++) {
    const element = allPortalEntities[i];
    if(element instanceof HTMLElement){
      element.dataset.status = 'dangling'
    }
  }
  for(const pKey in camera.portals) {
    const portal = camera.portals[pKey as CameraId];
    const portalTag = portalsEntity.value.querySelector(`[data-portal-id="${pKey}"]`);
    if(!portalTag) {
      console.log('creating portal entity!!!');
      const newPortal = document.createElement('a-entity');
      newPortal.dataset.portalId = pKey;
      const newBox = document.createElement('a-box');
      newBox.setAttribute('scale', '0.2 0.2 0.2');
      newBox.setAttribute('position', `0 0 ${-portal.distance}`);
      newBox.setAttribute('color', '#ef2d44');
      // newBox.setAttribute('mixin', 'cursorHighlight')
      newBox.setAttribute('hover-highlight', '');
      newBox.classList.add('clickable')
      newBox.addEventListener('mousedown', () => movedPortalCameraId.value = portal.toCameraId);
      newPortal.appendChild(newBox);
      portalsEntity.value.appendChild(newPortal);
      newPortal.setAttribute('rotation', `${portal.angleX} ${portal.angleY} 0`);
    } else {
      console.log('updating portal entity!!!');
      portalTag.setAttribute('rotation', `${portal.angleX} ${portal.angleY} 0`);
      if(portalTag instanceof HTMLElement) {
        delete portalTag.dataset.status
      }
    }
  }
  for (let i = allPortalEntities.length-1; i >= 0; i--) {
    const element = allPortalEntities[i];
    if(element instanceof HTMLElement){
      if(element.dataset.status === 'dangling') {
        console.log('removing portal tag');
        element.remove();
      }
    }
  }
}

watch(() => camera.portals, (portals) => {
  console.log('portals watcher triggered', portals);
  manuallyUpdatePortals();
});

watch(() => props.cameraId, async (newCamerId) => {
  console.log('cameraId changed');
  loadCamera(newCamerId);
});

</script>