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
      <a-camera
        ref="cameraEntity"
        :look-controls-enabled="true"
        reverse-mouse-drag="true"
      />
      <a-videosphere />
    </a-scene>
    <div class="flex flex-row gap-2 justify-center p-4">
      <div
        class="card shadow-md bg-primary text-neutral-content p-4 cursor-pointer"
        @click="adminStore.createCameraFromSender(`coolCamera-${senderId.substring(0,5)}`, senderId)"
      >
        skapa ny kamerprofil
      </div>
      <div
        class="card shadow-md bg-neutral text-neutral-content p-4 cursor-pointer"
        v-for="listedCamera in adminStore.adminOnlyVenueState?.cameras"
        :key="listedCamera.cameraId"
      >
        {{ listedCamera.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
// import 'aframe';
import type { SenderId } from 'schemas';
// import { useSoupStore } from '@/stores/soupStore';
import { type Entity, THREE } from 'aframe';
import { useAdminStore } from '@/stores/adminStore';

const videoTag = ref<HTMLVideoElement>();
const cameraEntity = ref<Entity>();


const camera = useCameraStore();
const adminStore = useAdminStore();

const props = defineProps<{
  senderId: SenderId
}>();

onMounted(() => {
  // loadCamera(props.cameraId);
});
onUnmounted(() => {
});

// async function loadCamera(cameraId: CameraId) {
//   console.log('loading camera');
//   await camera.joinCamera(cameraId);
//   const tracks = await camera.consumeCurrentCamera();
//   console.log(tracks);
//   console.assert(tracks && tracks.videoTrack && videoTag.value, 'prerequisites for attaching tracks not fullfilled');
//   if(!tracks || !tracks.videoTrack || !videoTag.value){
//     return;
//   }
//   videoTag.value.srcObject = new MediaStream([tracks.videoTrack]);
//   const vSphere = document.querySelector('a-videosphere');
//   vSphere.setAttribute('src', '#main-video');
// }

watch(() => camera.portals, (portals) => {
  console.log('portals watcher triggered', portals);
  // manuallyUpdatePortals();
});

watch(() => props.senderId, async (newSenderId) => {
  console.log('cameraId changed:', newSenderId);
  // loadCamera(newCamerId);
});

</script>