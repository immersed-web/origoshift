<template>
  <template
    v-if="vrSpaceStore.currentVrSpace"
  >
    <!-- <a-assets
      timeout="20000"
    >
      <a-asset-item
        id="model-asset"
        :src="modelUrl"
      />
      <a-asset-item
        v-if="navmeshUrl"
        id="navmesh-asset"
        :src="navmeshUrl"
      />
      <a-asset-item
        id="avatar-asset"
        src="/models/avatar/Character_Base_Mesh_5.glb"
        @loaded="avatarModelFileLoaded = true"
      />
    </a-assets> -->

    <a-sky color="lightskyblue" />
    <StreamEntrance
      v-if="entrancePosString"
      @click="goToStream"
      :position="entrancePosString"
      :direction="entranceRotation"
      :message="entranceMessage"
      class="clickable"
    />

    <!-- The model -->
    <a-entity>
      <a-gltf-model
        @model-loaded="onModelLoaded"
        id="model"
        ref="modelTag"
        :src="venueStore.modelUrl"
      />
      <a-gltf-model
        v-if="venueStore.navmeshUrl"
        id="navmesh"
        :src="venueStore.navmeshUrl"
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
        wasd-controls="acceleration:65;"
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
        ref="leftHandTag"
        id="left-hand"
        laser-controls="hand:left"
        raycaster="objects: .clickable"
        emit-move="interval: 20"
      />
      <a-entity
        ref="rightHandTag"
        id="right-hand"
        oculus-touch-controls="hand:right"
        blink-controls="cameraRig: #camera-rig; teleportOrigin: #camera; collisionEntities: #navmesh;"
        emit-move="interval: 20"
      />
    </a-entity>


    <!-- Avatar wrapper element -->
    <a-entity>
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <!-- The avatars -->
      <a-entity v-if="true">
        <template
          v-for="(clientInfo, id) in clients"
          :key="id"
        >
          <RemoteAvatar
            v-if="clientInfo.connectionId !== clientStore.clientState?.connectionId && clientInfo.transform"
            :id="'avatar-'+id"
            :client-info="clientInfo"
          />
        </template>
      </a-entity>
    </a-entity>
  </template>
</template>

<script setup lang="ts">
import { type Scene, type Entity, type EntityEventMap, type DetailEvent, utils as aframeUtils } from 'aframe';
import { ref, onMounted, computed, onBeforeUnmount, inject } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import type { ClientTransform } from 'schemas';
// import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
// import { useAutoEnterXR } from '@/composables/autoEnterXR';
import { throttle } from 'lodash-es';
// import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { useSoupStore } from '@/stores/soupStore';
import { useVrSpaceStore } from '@/stores/vrSpaceStore';
import StreamEntrance from './StreamEntrance.vue';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';

const router = useRouter();
// Stores
const vrSpaceStore = useVrSpaceStore();
const clientStore = useClientStore();
const venueStore = useVenueStore();
const soupStore = useSoupStore();

// Props & emits
const props = defineProps({
  // modelUrl: {type: String, required: true},
  // navmeshUrl: {type: String, default: ''},
  showNavMesh: {type: Boolean, default: false},
  // modelScale: {type: Number, default: 1},
});

type Point = [number, number, number];

// A-frame
// const sceneTag = ref<Scene>();
// useAutoEnterXR(sceneTag);
const { sceneTag } = inject(aFrameSceneProvideKey)!;


const modelTag = ref<Entity>();
const playerTag = ref<Entity>();
const playerOriginTag = ref<Entity>();
const leftHandTag = ref<Entity>();
const rightHandTag = ref<Entity>();

// const avatarModelFileLoaded = ref(false);

// const modelUrl = computed(() => {
//   return props.modelUrl;
// });

const navmeshId = computed(() => {
  return venueStore.navmeshUrl !== '' ? 'navmesh' : 'model';
});

const clients = computed(() => vrSpaceStore.currentVrSpace?.clients);
// watch(clients, (newClients, oldClients) => {
//   console.log('clients was updated. new:', newClients, 'old:', oldClients);
// });

const entrancePosString = computed(() => {
  const posArr = vrSpaceStore.currentVrSpace?.virtualSpace3DModel?.entrancePosition;
  if(!posArr) return undefined;
  const v = new AFRAME.THREE.Vector3(...posArr as Point);
  return AFRAME.utils.coordinates.stringify(v);
});

const entranceRotation = computed(() => {
  if(!vrSpaceStore.currentVrSpace?.virtualSpace3DModel?.entranceRotation) return 0;
  return vrSpaceStore.currentVrSpace.virtualSpace3DModel.entranceRotation;
});

const entranceMessage = ref('');

onMounted(async () => {
  sceneTag.value!.setAttribute('raycaster', {objects: '.clickable'});
  sceneTag.value!.setAttribute('cursor', {rayOrigin: 'mouse', fuse: false});

  // WebXR Immersive navigation handler.
  // if (navigator.xr && navigator.xr.addEventListener) {
  //   console.log('listening to sessiongranted');
  //   navigator.xr.addEventListener('sessiongranted', function () {
  //     entranceMessage.value = 'session granted!!!';
  //   });
  // }

  if(!vrSpaceStore.currentVrSpace) {
    await vrSpaceStore.enterVrSpace();
  }
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
});

onBeforeUnmount(async () => {
  sceneTag.value!.removeAttribute('raycaster');
  sceneTag.value!.removeAttribute('cursor');
  await soupStore.closeAudioProducer();
  await vrSpaceStore.leaveVrSpace();
});

async function onModelLoaded(){
  if(modelTag.value && playerOriginTag.value){
    // console.log(obj3D);
    let startPos = getRandomSpawnPosition();
    if(!startPos){
      console.log('failed to calculate spawnpoint. centering player on model bbox as fallback');
      const obj3D = modelTag.value.getObject3D('mesh');
      const bbox = new THREE.Box3().setFromObject(obj3D);
      startPos = new THREE.Vector3();
      bbox.getCenter(startPos);
    }
    playerOriginTag.value.object3D.position.set(startPos.x, startPos.y, startPos.z);
    const worldPos = playerTag.value!.object3D.getWorldPosition(new THREE.Vector3());
    const worldRot = playerTag.value!.object3D.getWorldQuaternion(new THREE.Quaternion());
    const trsfm: ClientTransform = {
      head: {
        position: worldPos.toArray(),
        orientation: worldRot.toArray() as [number, number, number, number],
      },
    };
    currentTransform.head = trsfm.head;
    await new Promise((res) => setTimeout(res, 200));
    
    vrSpaceStore.updateTransform(trsfm);
    // placeRandomSpheres();
    
    // @ts-ignore
    playerTag.value?.addEventListener('move', onHeadMove);
    // @ts-ignore
    leftHandTag.value?.addEventListener('move', onLeftHandMove);
    // @ts-ignore
    rightHandTag.value?.addEventListener('move', onRightHandMove);
  }
}

// Test function used to make sure we distribute spawn points nicely in the spawn area
function placeRandomSpheres() {
  for(let i = 0; i< 500; i++){
    const sphereEl = document.createElement('a-sphere');
    sphereEl.setAttribute('color', 'red');
    const pos = getRandomSpawnPosition();
    if(!pos) {
      console.error('failed to generate random spawn point');
      return;
    }
    const posString = AFRAME.utils.coordinates.stringify(pos);
    sphereEl.setAttribute('position', posString);
    sphereEl.setAttribute('scale', '0.05 0.05 0.05');
    sceneTag.value!.append(sphereEl);
  }
}

function getRandomSpawnPosition() {
  const spawnPosition = vrSpaceStore.currentVrSpace?.virtualSpace3DModel?.spawnPosition as Point | undefined;
  const spawnRadius = vrSpaceStore.currentVrSpace?.virtualSpace3DModel?.spawnRadius;
  if(!spawnPosition || !spawnRadius) return;
  const randomRadianAngle = 2 * Math.PI * Math.random(); // radian angle
  // Why sqrt? Check here: https://programming.guide/random-point-within-circle.html
  const randomDistance = Math.sqrt(Math.random()) * spawnRadius;
  const x = randomDistance * Math.cos(randomRadianAngle);
  const z = randomDistance * Math.sin(randomRadianAngle);
  const randomOffsetVector = new THREE.Vector3(x, 0, z);
  
  const spawnPointVector = new THREE.Vector3(...spawnPosition);
  spawnPointVector.add(randomOffsetVector);
  return spawnPointVector;
}

function goToStream(){
  // router.push({name: 'basicVR'});
  // console.log('sphere clicked');
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
              
const currentTransform: ClientTransform = {
  head: {
    position: [0,0,0],
    orientation: [0,0,0,0],
  },
};
function onHeadMove(e: DetailEvent<ClientTransform['head']>) {
  // console.log('head moved');
  currentTransform.head = e.detail;
  throttledTransformMutation();
}
function onLeftHandMove(e: DetailEvent<ClientTransform['leftHand']>) {
  // console.log('left hand moved');
  currentTransform.leftHand = e.detail;
  throttledTransformMutation();
}
function onRightHandMove(e: DetailEvent<ClientTransform['rightHand']>) {
  // console.log('right hand moved');
  currentTransform.rightHand = e.detail;
  throttledTransformMutation();
}

const throttledTransformMutation = throttle(async () => {
  if(!sceneTag.value?.is('vr-mode')) {
    delete currentTransform.leftHand;
    delete currentTransform.rightHand;
  }
  await vrSpaceStore.updateTransform(currentTransform);
  // Unset hands after theyre sent
}, 100, {trailing: true});

// Display message
const displayMessage = ref('');

function navmeshClicked(e: THREE.Event) {
  console.log(e.detail.intersection.point);
  teleportTo(e.detail.intersection.point);
}

function navmeshHovered(e: THREE.Event) {
  // console.log('navmesh rayCasted:', e);
  previewTeleport(e.detail.point);
}

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
