<template>
  <a-scene
    cursor="rayOrigin: mouse"
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
    </a-assets>

    <a-sky color="#ECECEC" />

    <!-- The model -->
    <a-entity v-if="loaded">
      <a-entity
        id="model"
        gltf-model="#model-asset"
        scale="0.2 0.2 0.2"
      />
      <a-entity
        id="navmesh"
        gltf-model="#navmesh-asset"
        scale="0.2 0.2 0.2"
      />
    </a-entity>

    <!-- Avatar wrapper element -->
    <a-entity position="2 0 0">
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <a-camera
        look-controls
        wasd-controls="acceleration:100;"
        emit-move="intervals: 40 500"
        position="0 2 0"
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

      <!-- The avatars -->
      <a-entity v-if="clientStore.clientTransforms">
        <RemoteAvatar
          v-for="[id, transform] in Object.entries(clientStore.clientTransforms).filter(e => e[0] !== clientStore.clientState.connectionId)"
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
import type { Scene } from 'aframe';
import { ref, onMounted, computed } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import { clientOrThrow } from '@/modules/trpcClient';
import type { ClientTransform } from 'schemas';
import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';

// Stores
const clientStore = useClientStore();

// Props & emits
const props = defineProps({
  modelUrl: {type: String, required: true},
  navmeshUrl: {type: String, default: ''},
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

  clientOrThrow.value.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      console.log(data);
      if(!data.added){
        delete clientStore.clientTransforms[data.client.connectionId];
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
  transformSubscription = clientOrThrow.value.vr.transforms.subClientTransforms.subscribe(undefined, {
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

async function cameraMoveSlow (e: CustomEvent<[number, number, number]>){
  // console.log('Camera move slow', positionStr);
  if(clientOrThrow){
    const position: ClientTransform['position'] = e.detail;
    const randomRot: ClientTransform['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
    await clientOrThrow.value.vr.transforms.updateTransform.mutate({orientation: randomRot, position});
  }
}

const cameraPosition = ref([0,0,0] as [number, number, number]);
function cameraMoveFast (e: CustomEvent<[number, number, number]>){
  cameraPosition.value = e.detail;
}

// Display message
const displayMessage = ref('');

</script>
