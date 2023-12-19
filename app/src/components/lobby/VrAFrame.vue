<template>
  <a-scene
    cursor="rayOrigin: mouse;  fuse: false;"
    raycaster="objects: .clickable"
    ref="scene"
  >
    <a-assets v-once>
      <a-asset-item
        id="model-asset"
        :src="modelUrl"
      />
      <a-asset-item
        id="navmesh-asset"
        :src="navmeshUrl"
      />
      <a-asset-item
        id="avatar-asset"
        src="/models/avatar/AVATAR_V1.gltf"
        @loaded="avatarModelFileLoaded = true"
      />
    </a-assets>

    <a-sky color="lightskyblue" />
    <StreamEntrance
      @click="goToStream"
      position="30 6 0"
      :direction="90"
      message="Yoooooooo vad har du i kikaren??"
      class="clickable"
    />

    <!-- The model -->
    <a-entity>
      <a-gltf-model
        @model-loaded="onModelLoaded"
        id="model"
        ref="modelTag"
        src="#model-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
      />
      <a-gltf-model
        id="navmesh"
        src="#navmesh-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
        class="clickable"
        @click="navmeshClicked"
        raycaster-listen
        @raycast-change="navmeshHovered"
        model-opacity="0.7"
        :visible="showNavMesh"
      />
    </a-entity>

    <!-- <a-sphere
      id="teleportPreview"
      color="#6173F4"
      radius="0.25"
    /> -->

    <a-entity id="teleportPreview">
      <a-ring
        color="teal"
        radius-inner="1"
        radius-outer="2"
        rotation="-90 0 0"
        scale="0.2 0.2 0.2"
        position="0 0.01 0"
      />
    </a-entity>

    <a-entity
      id="camera-rig"
      ref="playerOriginTag"
    >
      <a-ring
        color="blue"
        rotation="-90 0 0"
        radius-outer="0.3"
        radius-inner="0.2"
        material="transparent: true; opacity: 0.4"
      />
      <a-camera
        id="camera"
        ref="playerTag"
        look-controls="reverseMouseDrag: true; reverseTouchDrag: true;"
        wasd-controls="acceleration:75;"
        emit-move="interval: 20"
        position="0 1.65 0"
        :simple-navmesh-constraint="'navmesh:#'+navmeshId+'; fall:0.5; height:1.65;'"
      >
        <!-- <a-box
          position="0 -0.1 -0.2"
          scale="0.1 0.1 0.1"
        /> -->
        <a-entity
          v-if="
            displayMessage.length"
          :text="'value: ' + displayMessage"
          position="0 0 -1"
          animation="property: object3D.position.y; to: 0.1; dir: alternate; dur: 500; loop: true"
        />
      </a-camera>
      <a-entity
        id="left-hand"
        laser-controls="hand:left"
        raycaster="objects: .clickable"
      />
      <a-entity
        id="right-hand"
        oculus-touch-controls="hand:right"
        blink-controls="cameraRig: #camera-rig; teleportOrigin: #camera; collisionEntities: #navmesh;"
      />
    </a-entity>


    <!-- Avatar wrapper element -->
    <a-entity>
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <!-- The avatars -->
      <a-entity v-if="avatarModelFileLoaded">
        <template
          v-for="(clientInfo, id) in clients"
          :key="id"
        >
          <RemoteAvatar
            v-if="clientInfo.connectionId !== clientStore.clientState?.connectionId"
            :id="'avatar-'+id"
            :client-info="clientInfo"
          />
        </template>
      </a-entity>
    </a-entity>
  </a-scene>
</template>

<script setup lang="ts">
import { type Scene, type Entity, utils as aframeUtils } from 'aframe';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import type { ClientTransform } from 'schemas';
// import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import { useAutoEnterXR } from '@/composables/autoEnterXR';
import { throttle } from 'lodash-es';
// import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { useSoupStore } from '@/stores/soupStore';
import { useVrSpaceStore } from '@/stores/vrSpaceStore';
import StreamEntrance from './StreamEntrance.vue';

const router = useRouter();
// Stores
const vrSpaceStore = useVrSpaceStore();
const clientStore = useClientStore();
const venueStore = useVenueStore();
const soupStore = useSoupStore();

// Props & emits
const props = defineProps({
  modelUrl: {type: String, required: true},
  navmeshUrl: {type: String, default: ''},
  showNavMesh: {type: Boolean, default: false},
  modelScale: {type: Number, default: 1},
});

// A-frame
const scene = ref<Scene>();
useAutoEnterXR(scene);
const modelTag = ref<Entity>();
const playerTag = ref<Entity>();
const playerOriginTag = ref<Entity>();

const avatarModelFileLoaded = ref(false);

const modelUrl = computed(() => {
  return props.modelUrl;
});

const navmeshId = computed(() => {
  return props.navmeshUrl !== '' ? 'navmesh' : 'model';
});

const clients = computed(() => vrSpaceStore.currentVrSpace?.clients);
// watch(clients, (newClients, oldClients) => {
//   console.log('clients was updated. new:', newClients, 'old:', oldClients);
// });


onMounted(async () => {
  if(!soupStore.deviceLoaded){
    await soupStore.loadDevice();
  }
  await soupStore.createReceiveTransport();
  
  try{
    await soupStore.createSendTransport();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const [track] = stream.getAudioTracks();
    await soupStore.produce({
      track,
      producerInfo: {
        isPaused: false,
      },
    });
  } catch(e){
    console.error('failed to setup the mediasoup stuff');
  }

  // await vrSpaceStore.enterVrSpace();
});

onBeforeUnmount(async () => {
  await soupStore.closeAudioProducer();
  await vrSpaceStore.leaveVrSpace();
});

function onModelLoaded(){
  if(modelTag.value && playerOriginTag.value){
    // console.log(obj3D);
    const startPos = new THREE.Vector3();
    if(!vrSpaceStore.currentVrSpace?.virtualSpace3DModel?.spawnPosition){
      console.log('centering player on model bbox');
      const obj3D = modelTag.value.getObject3D('mesh');
      const bbox = new THREE.Box3().setFromObject(obj3D);
      bbox.getCenter(startPos);
    } else {
      console.log('centering player on spawnposition');
      startPos.set(...vrSpaceStore.currentVrSpace.virtualSpace3DModel.spawnPosition as [number, number, number]);
    }
    playerOriginTag.value.object3D.position.set(startPos.x, startPos.y, startPos.z);
    const worldPos = playerTag.value!.object3D.getWorldPosition(new THREE.Vector3());
    const worldRot = playerTag.value!.object3D.getWorldQuaternion(new THREE.Quaternion());
    const trsfm: ClientTransform = {
      position: worldPos.toArray(),
      orientation: worldRot.toArray() as [number, number, number, number],
    };
    vrSpaceStore.updateTransform(trsfm);
    // @ts-ignore
    playerTag.value?.addEventListener('move', throttledTransformMutation);
  }
}

function goToStream(){
  console.log('sphere clicked');
  if(!venueStore.currentVenue) return;
  const firstCamera = Object.keys(venueStore.currentVenue.cameras)[0];
  if(!firstCamera) return;
  router.push({
    name: 'userCamera',
    params: {
      venueId: venueStore.currentVenue.venueId,
      cameraId: firstCamera,
    },
  });
}

const throttledTransformMutation = throttle(async (transformEvent: CustomEvent<ClientTransform>) => {
  await vrSpaceStore.updateTransform(transformEvent.detail);
}, 100, {trailing: true});

// Display message
const displayMessage = ref('');

function navmeshClicked(e: THREE.Event) {
  console.log(e.detail.intersection.point);
  teleportTo(e.detail.intersection.point);
}

function navmeshHovered(e: THREE.Event) {
  console.log('navmesh rayCasted:', e);
  previewTeleport(e.detail.point);
}

// function onIntersected(e: DetailEvent<any>){
//   const isInXR = aframeUtils.device.checkHeadsetConnected();
//   console.log('isHeadsetConnected:', isInXR);
//   console.log('intersected:', e.detail);
// }

function teleportTo (point: THREE.Vector3){
  console.log(point);
  playerOriginTag.value?.setAttribute('position', aframeUtils.coordinates.stringify(point));
  playerTag.value?.object3D.position.setX(0);
  playerTag.value?.object3D.position.setZ(0);
}

function previewTeleport (point: THREE.Vector3){
  const teleportRing = document.querySelector('#teleportPreview');
  teleportRing.setAttribute('position', point);
}

</script>
