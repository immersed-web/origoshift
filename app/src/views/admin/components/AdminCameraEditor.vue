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
        <a-entity ref="startAngle">
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
              material="transparent: true; opacity:0"
              class="clickable"
              @mousedown="movedObject = startAngle"
              @mouseup="movedObject = undefined"
            />
          </a-ring>
        </a-entity>
        <a-entity
          v-if="camera.portals"
        >
          <a-entity
            v-for="portal in camera.portals"
            :key="portal.cameraId"
            :rotation="`${portal.angleZ} ${portal.angleY} 0`"
          >
            <!-- :rotation="`${xRot} ${yRot} ${zRot}`" -->
            <!-- <a-entity
            mixin="cursorHighlight"
            > -->
            <a-box
              :position="`0 0 ${-portal.distance}`"
              scale="0.2 0.2 0.2"
              color="#ef2d5e"
              class="clickable"
            />
            <!-- </a-entity> -->
          </a-entity>
        </a-entity>
      </a-entity>
      <a-camera reverse-mouse-drag="true" />
      <a-videosphere />
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { onMounted, ref, watch } from 'vue';
// import 'aframe';
import type { CameraId } from 'schemas';
import { useSoupStore } from '@/stores/soupStore';
import { type Entity, THREE } from 'aframe';

const videoTag = ref<HTMLVideoElement>();

const startAngle = ref<Entity>();

const camera = useCameraStore();
// const soup = useSoupStore();

const props = defineProps<{
  cameraId: CameraId
}>();

onMounted(() => {
  console.log(videoTag.value);
  loadCamera(props.cameraId);
});
const movedObject = ref<Entity>();
document.addEventListener('pointermove', (ev) => {
  if (!movedObject.value) return;
  console.log(ev);
  movedObject.value.object3D.rotation.y -= THREE.MathUtils.degToRad(ev.movementX * 0.1);
  const newZ = movedObject.value.object3D.rotation.x - THREE.MathUtils.degToRad(ev.movementY * 0.1);
  movedObject.value.object3D.rotation.x = THREE.MathUtils.clamp(newZ, -Math.PI / 4, Math.PI / 4);
});

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