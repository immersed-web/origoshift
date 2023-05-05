<template>
  <div class="w-full aspect-video bg-slate-500">
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
      <a-entity
        position="0 1.6 0"
      >
        <a-entity ref="startAngleEntity">
          <a-ring
            radius-inner="0.1"
            radius-outer="0.2"
            position="0 0 -2"
            color="teal"
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
          v-if="camera.portals"
        >
          <a-entity
            v-for="portal in camera.portals"
            :key="portal.cameraId"
            :rotation="`${portal.angleX} ${portal.angleY} 0`"
          >
            <a-box
              :position="`0 0 ${-portal.distance}`"
              scale="0.2 0.2 0.2"
              color="#ef2d5e"
              class="clickable"
              @mousedown="movedPortalCameraId = portal.cameraId"
            />
          </a-entity>
        </a-entity>
      </a-entity>
      <a-camera
        :look-controls-enabled="!movedEntity && !movedPortalCameraId"
        reverse-mouse-drag="true"
      />
      <a-videosphere />
    </a-scene>
    <div class="flex flex-row gap-2 justify-center p-4">
      <div
        class="card shadow-md bg-amber-600/50 p-4"
        v-for="listedCamera in adminStore.adminOnlyVenueState?.cameras"
        :key="listedCamera.cameraId"
      >
        {{ listedCamera.name }}
      </div>
      <div>
        {{ movedPortalCameraId }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { onMounted, onUnmounted, ref, watch } from 'vue';
// import 'aframe';
import type { CameraId } from 'schemas';
// import { useSoupStore } from '@/stores/soupStore';
import { type Entity, THREE } from 'aframe';
import { useAdminStore } from '@/stores/adminStore';

const videoTag = ref<HTMLVideoElement>();

const startAngleEntity = ref<Entity>();
const movedPortalCameraId = ref<CameraId>();


const camera = useCameraStore();
const adminStore = useAdminStore();
// const soup = useSoupStore();

const props = defineProps<{
  cameraId: CameraId
}>();

function onMouseUp(evt: Event){
  movedPortalCameraId.value = undefined;
  movedEntity.value = undefined;
}
function onMouseMove(ev: MouseEvent){
  // console.log(ev);
  if (movedEntity.value){
    movedEntity.value.object3D.rotation.y -= THREE.MathUtils.degToRad(ev.movementX * 0.15);
    const newZ = movedEntity.value.object3D.rotation.x - THREE.MathUtils.degToRad(ev.movementY * 0.15);
    movedEntity.value.object3D.rotation.x = THREE.MathUtils.clamp(newZ, -Math.PI / 4, Math.PI / 4);
  } else if(movedPortalCameraId.value && camera.currentCamera) {

    console.log('moving portal!');
    const idx = camera.currentCamera.portals.findIndex(p => p.toCameraId === movedPortalCameraId.value);
    if(idx !== -1){
      camera.currentCamera.portals[idx].x += ev.movementX * 0.001;
      camera.currentCamera.portals[idx].y += ev.movementY * 0.001;
    }
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
const movedEntity = ref<Entity>();

async function loadCamera(cameraId: CameraId) {
  console.log('loading camera');
  await camera.joinCamera(cameraId);
  const tracks = await camera.consumeCurrentCamera();
  console.log(tracks);
  console.assert(tracks && tracks.videoTrack && videoTag.value, 'prerequisites for attaching tracks not fullfilled');
  if(!tracks || !tracks.videoTrack || !videoTag.value){
    return;
  }
  videoTag.value.srcObject = new MediaStream([tracks.videoTrack]);
  const vSphere = document.querySelector('a-videosphere');
  vSphere.setAttribute('src', '#main-video');
}

watch(() => props.cameraId, async (newCamerId) => {
  console.log('cameraId changed');
  loadCamera(newCamerId);
});

</script>