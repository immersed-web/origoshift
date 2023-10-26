<template>
  <div class="w-full aspect-video relative">
    <div class="rounded-br-xl bg-neutral/60 absolute p-2 top-0 left-0 z-10">
      <div class="flex flex-nowrap items-center gap-2">
        <template v-if="isEditingCameraName">
          <input
            v-model="camera.currentCamera!.name"
            type="text"
            class="input"
          >
          <button
            @click="setCameraName()"
            class="btn btn-sm btn-primary btn-circle"
          >
            <span class="material-icons">save</span>
          </button>
        </template>
        <template v-else>
          <p class="text-neutral-content text-lg font-semibold drop-shadow-lg ">
            {{ camera.currentCamera?.name }}
          </p>
          <button
            @click="isEditingCameraName = true"
            class="btn btn-sm btn-primary btn-circle"
          >
            <span class="material-icons">edit</span>
          </button>
        </template>
      </div>
      <div class="form-control">
        <label class="label">
          <input
            type="checkbox"
            @change="toggle360Camera"
            v-model="is360Camera"
            class="toggle toggle-primary"
          >
          <span class="pl-2 label-text text-neutral-content cursor-pointer">360-kamera</span>
        </label>
      </div>
    </div>
    <a-scene
      class=""
      embedded
      cursor="rayOrigin: mouse; fuse: false;"
      raycaster="objects: .clickable"
      vr-mode-ui="enabled: false;"
    >
      <video
        class="hidden"
        ref="videoTag"
        id="main-video"
        autoplay
      />
      <a-assets>
        <img
          id="portal-texture"
          src="@/assets/portal-1.png"
        >
        <a-mixin
          id="slow-rotation"
          animation="property: rotation; from: 0 0 0; to: 0 0 360; dur: 100000; loop: true; easing: linear;"
        />
      </a-assets>
      <a-camera
        ref="cameraEntity"
        :look-controls-enabled="!movedEntity && !movedPortalCameraId && !cameraIsAnimating"
        reverse-mouse-drag="true"
      />
      <a-videosphere
        material="depthTest: false"
        :visible="is360Camera"
        :geometry="`phiLength:${camera.FOV?.phiLength??360}; phiStart:${camera.FOV?.phiStart??0}`"
        rotation="0 90 0"
      />
      <a-video
        :height="videoHeight"
        :width="fixedWidth"
        :position="`0 ${videoHeight*0.5} 10`"
        :visible="!is360Camera"
        src="#main-video"
      />
      <a-entity
        position="0 1.6 0"
      >
        <a-entity
          ref="viewOriginEntity"
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
              @mousedown="movedEntity = viewOriginEntity"
            />
            <a-text
              material="depthTest:false"
              position="0 -0.3 0"
              value="startvy"
              align="center"
            />
          </a-ring>
        </a-entity>
        <a-entity id="vue-list">
          <template
            v-for="portal in camera.portals"
            :key="portal.toCameraId"
          >
            <a-entity
              :id="portal.toCameraId"
              :rotation="`${portal.angleX} ${portal.angleY} 0`"
            >
              <a-image
                @mousedown="movedPortalCameraId = portal.toCameraId"
                hover-highlight
                class="clickable"
                scale="0.4 0.4 0.4"
                :position="`0 0 -${portal.distance}`"
                mixin="slow-rotation"
                src="#portal-texture"
              />
            </a-entity>
          </template>
        </a-entity>
        <!-- <a-entity id="manual-list"
          ref="portalsEntity"
        >
        </a-entity> -->
      </a-entity>
    </a-scene>
    <div class="bottom-0 absolute w-full bg-neutral/50 flex flex-row gap-4 justify-center p-4">
      <template
        v-for="listedCamera in camerasWithPortalInfo"
        :key="listedCamera.cameraId"
      >
        <div v-if="listedCamera.cameraId !== camera.currentCamera?.cameraId">
          <div 
            v-if="listedCamera.hasPortal"
            class="group card bg-primary/75 outline outline-2 outline-offset-1 outline-primary select-none text-primary-content p-4 grid grid-cols-2 items-center justify-items-center gap-2"
          >
            <div class="col-span-full row-start-1 justify-self-center group-hover:invisible">
              {{ listedCamera.name }}
            </div>
            <button
              @click="createOrCenterOnPortal(listedCamera.cameraId)"
              class="row-start-1 col-start-1 col-span-1 btn btn-square btn-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">visibility</span>
            </button>
            <button 
              @click="adminStore.deletePortal(camera.currentCamera!.cameraId, listedCamera.cameraId)" 
              class="row-start-1 col-start-2 col-span-1 btn btn-square btn-error opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
          <div
            v-else
            class="group card outline outline-2 outline-neutral-content/20 bg-neutral/75 select-none text-neutral-content p-4 grid grid-cols-2 items-center justify-items-center gap-2"
          >
            <div class="col-span-full row-start-1 justify-self-center">
              {{ listedCamera.name }}
            </div>
            <button 
              @click="createOrCenterOnPortal(listedCamera.cameraId)" 
              class="row-start-1 col-start-2 col-span-1 btn btn-square btn-accent place-self-end opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">add_circle</span>
            </button>
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
const viewOriginEntity = ref<Entity>();
const portalsEntity = ref<Entity>();
const movedPortalCameraId = ref<CameraId>();
const cameraIsAnimating = ref(false);
const isEditingCameraName = ref(false);
const is360Camera = ref(true);

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
    const newCam = { hasPortal, ...cam};
    camerasWithPortalInfo.push(newCam);
  }
  return camerasWithPortalInfo;
});
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
      }, 
    });
  }
  movedPortalCameraId.value = undefined;
  movedEntity.value = undefined;
}
// TODO: Perhaps calculate pixelToRayAngles to make the objects forllow mouse correctly
// Can perhaps somehow be achieved by using the raycaster provided by the cursor component, or building our own component.
function onMouseMove(ev: MouseEvent){
  const xSpeed = 0.0004;
  const ySpeed = 0.0008;
  // console.log(ev);
  if(!camera.currentCamera) return;
  if (movedEntity.value){
    // movedEntity.value.object3D.rotation.reorder('YXZ');
    // movedEntity.value.object3D.rotation.y -= THREE.MathUtils.degToRad(ev.movementX * 0.15);
    // const newZ = movedEntity.value.object3D.rotation.x - THREE.MathUtils.degToRad(ev.movementY * 0.15);
    // movedEntity.value.object3D.rotation.x = THREE.MathUtils.clamp(newZ, -Math.PI / 2, Math.PI / 2);
    const newX = camera.currentCamera.viewOrigin.x + ev.movementX * xSpeed;
    camera.currentCamera.viewOrigin.x = (1.0 + newX) % 1.0;
    camera.currentCamera.viewOrigin.y += ev.movementY * ySpeed;
  } else if(movedPortalCameraId.value) {
    const newX = camera.currentCamera.portals[movedPortalCameraId.value].x + ev.movementX * xSpeed;
    camera.currentCamera.portals[movedPortalCameraId.value].x = (1.0 + newX) % 1.0;
    camera.currentCamera.portals[movedPortalCameraId.value].y += ev.movementY * ySpeed;
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

const fixedWidth = 20;
const videoHeight = ref(1.0);

function setVideoDimensionsFromTag(vTag: HTMLVideoElement){
  const w = vTag.videoWidth;
  const h = vTag.videoHeight;
  console.log(w,h);
  const ratio = w / h;
  videoHeight.value = fixedWidth/ratio;
}

async function loadCamera(cameraId: CameraId) {
  console.log('loading camera');
  await camera.joinCamera(cameraId);
  is360Camera.value = camera.currentCamera?.cameraType !== 'normal';
  const tracks = await camera.consumeCurrentCamera();
  console.log(tracks);
  if(!videoTag.value){
    return;
  }
  if(!tracks || !tracks.videoTrack ){
    console.error('no tracks received from camera');
    if(import.meta.env.DEV){
      console.warn('falling back to using demo video because we are in dev mode');
      videoTag.value.srcObject = null;
      videoTag.value.muted = true;
      videoTag.value.loop = true;
      // videoTag.value.src = 'https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4';
      videoTag.value.setAttribute('crossorigin', 'anynomous');
      videoTag.value.src = 'https://video.360cities.net/aeropicture/01944711_VIDEO_0520_1_H264-1920x960.mp4';
      videoTag.value.play();
      const vSphere = document.querySelector('a-videosphere');
      vSphere.setAttribute('src', '#main-video');
      videoTag.value.addEventListener('playing', () => setVideoDimensionsFromTag(videoTag.value!), { once: true });
    }
    return;
  }
  videoTag.value.src = '';
  videoTag.value.loop = false;
  videoTag.value.muted = false;
  videoTag.value.srcObject = new MediaStream([tracks.videoTrack]);
  const vSphere = document.querySelector('a-videosphere');
  rotateCameraToOrigin();
  vSphere.setAttribute('src', '#main-video');
  // setVideoDimensionsFromTrack(tracks.videoTrack as MediaStreamVideoTrack)
  videoTag.value.addEventListener('playing', () => setVideoDimensionsFromTag(videoTag.value!), { once: true });
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

    // enforce y angle is in the range 0 - 360
    // js %-operator is remainder operator and not true modulus. I.E. it doesnt wrap negative input.
    const rot = rotationTarget.object3D.rotation;
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
    rotationTarget.setAttribute('animation', rotationString);

    (rotationTarget as HTMLElement).addEventListener('animationcomplete', () => {
      if(!rotationTarget) return;
      const newRotation = rotationTarget.getAttribute('rotation');
      // @ts-expect-error
      rotationTarget.components['look-controls'].pitchObject.rotation.x = THREE.MathUtils.degToRad(newRotation.x);
      // @ts-expect-error
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

function rotateCameraToOrigin(){
  if(!cameraEntity.value || !camera.viewOrigin) return;
  const cameraTag = cameraEntity.value;
  cameraTag.setAttribute('look-controls', {enabled: false});
  // cameraTa.value?.object3D.rotateY(camera.viewOrigin?.angleY??0);
  // cameraTa.value?.object3D.rotateX(camera.viewOrigin?.angleX??0);
  // @ts-ignore
  cameraTag.components['look-controls'].pitchObject.rotation.x = THREE.MathUtils.degToRad(camera.viewOrigin.angleX);
  // @ts-ignore
  cameraTag.components['look-controls'].yawObject.rotation.y = THREE.MathUtils.degToRad(camera.viewOrigin.angleY);
  cameraTag.setAttribute('look-controls', {enabled: true});
}

function setCameraName(){
  if(!camera.currentCamera) return;
  adminStore.setCameraName(camera.currentCamera.cameraId, camera.currentCamera.name);
  isEditingCameraName.value = false;
}

function toggle360Camera(){
  console.log('toggle clicked');
  if(!camera.currentCamera) return;
  adminStore.setCameraType(camera.currentCamera.cameraId, is360Camera.value?'panoramic360':'normal');
}

// NOTE: Not completely sure why we have to do this. Using vue to v-for over the portals didnt work for some reason.
function manuallyUpdatePortals () {
  if(!camera.portals || !portalsEntity.value) return;
  const allPortalEntities = portalsEntity.value.children;
  for (let i = 0; i < allPortalEntities.length; i++) {
    const element = allPortalEntities[i];
    if(element instanceof HTMLElement){
      element.dataset.status = 'dangling';
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
      newBox.classList.add('clickable');
      newBox.addEventListener('mousedown', () => movedPortalCameraId.value = portal.toCameraId);
      newPortal.appendChild(newBox);
      portalsEntity.value.appendChild(newPortal);
      newPortal.setAttribute('rotation', `${portal.angleX} ${portal.angleY} 0`);
    } else {
      console.log('updating portal entity!!!');
      portalTag.setAttribute('rotation', `${portal.angleX} ${portal.angleY} 0`);
      if(portalTag instanceof HTMLElement) {
        delete portalTag.dataset.status;
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
  // manuallyUpdatePortals();
});

watch(() => props.cameraId, async (newCamerId) => {
  console.log('cameraId changed');
  loadCamera(newCamerId);
});

</script>