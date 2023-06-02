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
      <button
        v-if="newName === undefined"
        class="btn btn-primary btn-sm"
        @click="newName = ''"
      >
        skapa ny kameraprofil
      </button>
      <form 
        v-else
        class="card p-2 bg-slate-400 flex flex-col flex-nowrap gap-2"
        @submit.prevent="adminStore.createCameraFromSender(newName, senderId)"
      >
        <input
          type="text"
          class="input input-sm"
          v-model="newName"
        >
        <div class="flex flex-nowrap gap-2">
          <button
            type="submit"
            class="btn btn-primary flex-auto"
          >
            <span class="material-icons">add</span>
          </button>
          <button
            @click="newName = undefined"
            class="btn flex-auto"
          >
            <span class="material-icons">cancel</span>
          </button>
        </div>
      </form>
      <template
        v-for="listedCamera in adminStore.adminOnlyVenueState?.cameras"
        :key="listedCamera.cameraId"
      >
        <button
          v-if="!listedCamera.senderAttached"
          class="btn btn-sm"
          @click="attachSenderToCamera(listedCamera.cameraId)"
        >
          {{ listedCamera.name }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { onMounted, onUnmounted, ref, watch } from 'vue';
// import 'aframe';
import type { SenderId, CameraId } from 'schemas';
// import { useSoupStore } from '@/stores/soupStore';
// import { useSoupStore } from '@/stores/soupStore';
import type { Entity, THREE } from 'aframe';
import { useAdminStore } from '@/stores/adminStore';

const videoTag = ref<HTMLVideoElement>();
const cameraEntity = ref<Entity>();

const newName = ref<string>();


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

function attachSenderToCamera(cameraId: CameraId){
  adminStore.setSenderForCamera(cameraId, props.senderId);
}

watch(() => camera.portals, (portals) => {
  console.log('portals watcher triggered', portals);
  // manuallyUpdatePortals();
});

watch(() => props.senderId, async (newSenderId) => {
  console.log('cameraId changed:', newSenderId);
  // loadCamera(newCamerId);
});

</script>