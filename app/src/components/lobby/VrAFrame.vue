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
      />
    </a-assets>

    <a-sky color="#ECECEC" />
    <a-sphere
      @click="goToStream"
      color="red"
      position="30 6 0"
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

    <a-entity ref="playerOriginTag">
      <a-camera
        id="camera"
        ref="playerTag"
        look-controls="reverseMouseDrag: true; reverseTouchDrag: true;"
        wasd-controls="acceleration:75;"
        emit-move="interval: 40"
        position="0 1.65 0"
        @move="cameraMoveFast"
        :simple-navmesh-constraint="'navmesh:#'+navmeshId+'; fall:0.5; height:1.65;'"
      >
        <a-entity
          v-if="
            displayMessage.length"
          :text="'value: ' + displayMessage"
          position="0 0 -1"
          animation="property: object3D.position.y; to: 0.1; dir: alternate; dur: 500; loop: true"
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


    <!-- Avatar wrapper element -->
    <a-entity>
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <!-- The avatars -->
      <a-entity v-if="clientStore.clientTransforms">
        <RemoteAvatar
          v-for="(transform, id) in otherClients"
          :key="id"
          :id="'avatar-'+id"
          :transform="transform"
          :camera-position="cameraPosition"
        />
      </a-entity>
    </a-entity>
  </a-scene>
</template>

<script setup lang="ts">
import 'aframe';
import { type Scene, type Entity, THREE, utils as aframeUtils } from 'aframe';
import { ref, onMounted, computed } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import type { ClientTransform } from 'schemas';
import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import { useAutoEnterXR } from '@/composables/autoEnterXR';
import { throttle } from 'lodash-es';

const router = useRouter();
// Stores
const connectionStore = useConnectionStore();
const clientStore = useClientStore();
const venueStore = useVenueStore();

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

const modelUrl = computed(() => {
  return props.modelUrl;
});

const navmeshId = computed(() => {
  return props.navmeshUrl !== '' ? 'navmesh' : 'model';
});

const otherClients = computed(() => {
  if(!clientStore.clientTransforms) return {};
  const filteredArr = Object.entries(clientStore.clientTransforms).filter(([cId, transform]) => cId !== clientStore.clientState?.connectionId);
  return Object.fromEntries(filteredArr);
});

// Server, Client, etc.

onMounted(async () => {

  startTransformSubscription();

  connectionStore.client.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      console.log(data);
      if(!data.added){
        delete clientStore.clientTransforms?.[data.client.connectionId];
      }
    },
  });

  // Clear clients on C key down
  window.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
      clientStore.clientTransforms = {};
    }
  });

});

let transformSubscription: Unsubscribable | undefined = undefined;
function startTransformSubscription() {
  if(transformSubscription){
    transformSubscription.unsubscribe();
  }
  transformSubscription = connectionStore.client.vr.clients.subClientTransforms.subscribe(undefined, {
    onData(transformMsg) {
      clientStore.clientTransforms = {...clientStore.clientTransforms, ...transformMsg.data};
      // console.log('received transform data!', data, clientStore.clientTransforms);
    },
  });
  console.log('Subscribe to client transforms',transformSubscription);
}

function onModelLoaded(){
  if(modelTag.value && playerOriginTag.value){
    console.log('centering camera on model bbox');
    const obj3D = modelTag.value.getObject3D('mesh');
    // console.log(obj3D);
    
    const bbox = new THREE.Box3().setFromObject(obj3D);
    const modelCenter = bbox.getCenter(new THREE.Vector3());
    playerOriginTag.value.object3D.position.set(modelCenter.x, modelCenter.y, modelCenter.z);

  }
}

function goToStream(){
  console.log('sphere clicked');
  if(!venueStore.currentVenue) return;
  const firstCamera = Object.keys(venueStore.currentVenue.cameras)[0];
  router.push({
    name: 'userCamera',
    params: {
      venueId: venueStore.currentVenue.venueId,
      cameraId: firstCamera,
    },
  });
}

// Move callbacks

// async function cameraMoveSlow (e: CustomEvent<{position: [number, number, number], orientation: [number, number, number, number]}>){
//   // console.log('Camera move slow', positionStr);
//   if(connectionStore.clientExists){
//     const position: ClientTransform['position'] = e.detail.position;
//     const orientation: ClientTransform['orientation'] = e.detail.orientation;
//     await connectionStore.client.vr.clients.updateTransform.mutate({position, orientation});
//   }
// }

const throttledTransformMutation = throttle(async (transformEvent: CustomEvent<ClientTransform>) => {
  if(connectionStore.clientExists){
    // const position: ClientTransform['position'] = transformEvent.detail.position;
    // const orientation: ClientTransform['orientation'] = transformEvent.detail.orientation;
    await connectionStore.client.vr.clients.updateTransform.mutate(transformEvent.detail);
  }
}, 200, {trailing: true});

const cameraPosition = ref([0,0,0] as [number, number, number]);
function cameraMoveFast (e: CustomEvent<{position: [number, number, number], orientation: [number, number, number, number]}>){
  cameraPosition.value = e.detail.position;
  throttledTransformMutation(e);
}

// Display message
const displayMessage = ref('');

function navmeshClicked(e: THREE.Event) {
  console.log(e.detail.intersection.point);
  teleportTo(e.detail.intersection.point);
}

function navmeshHovered(e: THREE.Event) {
  previewTeleport(e.detail);
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
