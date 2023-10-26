<template>
  <a-scene
    cursor="rayOrigin: mouse;  fuse: false;"
    raycaster="objects: .clickable"
    ref="scene"
  >
    <a-assets @loaded="onLoaded">
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

    <!-- The model -->
    <a-entity v-if="loaded">
      <a-entity
        id="model"
        gltf-model="#model-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
      />
      <a-entity
        id="navmesh"
        gltf-model="#navmesh-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
        class="clickable"
        @mousedown="navmeshClicked"
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

    <a-entity>
      <a-camera
        id="camera"
        look-controls
        wasd-controls="acceleration:100;"
        emit-move="intervals: 40 500"
        position="0 1.65 0"
        @move0="cameraMoveFast"
        @move1="cameraMoveSlow"
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
    </a-entity>


    <!-- Avatar wrapper element -->
    <a-entity>
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <!-- The avatars -->
      <a-entity v-if="clientStore.clientTransforms">
        <RemoteAvatar
          v-for="[id, transform] in Object.entries(clientStore.clientTransforms).filter(e => e[0] !== clientStore.clientState?.connectionId)"
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
import type { AFrame, Scene, THREE } from 'aframe';
import { ref, onMounted, computed } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import type { ClientTransform } from 'schemas';
import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';
import { useConnectionStore } from '@/stores/connectionStore';

// Stores
const connectionStore = useConnectionStore();
const clientStore = useClientStore();

// Props & emits
const props = defineProps({
  modelUrl: {type: String, required: true},
  navmeshUrl: {type: String, default: ''},
  showNavMesh: {type: Boolean, default: false},
  modelScale: {type: Number, default: 1},
});

// A-frame
const scene = ref<Scene>();

const modelUrl = computed(() => {
  return props.modelUrl;
});

const navmeshId = computed(() => {
  return props.navmeshUrl !== '' ? 'navmesh' : 'model';
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
  transformSubscription = connectionStore.client.vr.transforms.subClientTransforms.subscribe(undefined, {
    onData(data) {
      clientStore.clientTransforms = {...clientStore.clientTransforms, ...data};
      // console.log('received transform data!', data, clientStore.clientTransforms);
    },
  });
  console.log('Subscribe to client transforms',transformSubscription);
}

// Load a-frame assets
const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
}

// Move callbacks

async function cameraMoveSlow (e: CustomEvent<{position: [number, number, number], orientation: [number, number, number, number]}>){
  // console.log('Camera move slow', positionStr);
  if(connectionStore.clientExists){
    // const position: ClientTransform['position'] = e.detail;
    // const randomRot: ClientTransform['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
    const position: ClientTransform['position'] = e.detail.position;
    const orientation: ClientTransform['orientation'] = e.detail.orientation;
    await connectionStore.client.vr.transforms.updateTransform.mutate({position, orientation});
  }
}

const cameraPosition = ref([0,0,0] as [number, number, number]);
function cameraMoveFast (e: CustomEvent<[number, number, number]>){
  cameraPosition.value = e.detail;
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
  const cam = document.querySelector('#camera');
  cam.setAttribute('position', {x: point.x, y: point.y + 1.65, z: point.z});
}

function previewTeleport (point: THREE.Vector3){
  const cam = document.querySelector('#teleportPreview');
  cam.setAttribute('position', point);
}

</script>
