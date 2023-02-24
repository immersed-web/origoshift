<template>
  <div>
    A-frame
    <a-scene cursor="rayOrigin: mouse">
      <a-assets @loaded="onLoaded">
        <img
          id="groundTexture"
          src="https://cdn.aframe.io/a-painter/images/floor.jpg"
        >
        <a-asset-item
          id="venue-asset"
          src="/models/venue/venue/scene.gltf"
        />
        <a-asset-item
          id="venue_navmesh-asset"
          src="/models/venue/venue_navmesh/scene.gltf"
        />
        <a-asset-item
          id="dungeon-asset"
          src="/models/dungeon/dungeon.gltf"
        />
        <a-asset-item
          id="dungeon_navmesh-asset"
          src="/models/dungeon/navmesh.gltf"
        />
        <a-asset-item
          id="hallway-asset"
          src="/models/hallway/scene.gltf"
        />
      </a-assets>

      <a-sky color="#ECECEC" />

      <!-- The model -->
      <a-entity v-if="loaded">
        <a-entity
          id="hallway"
          gltf-model="#hallway-asset"
          scale="0.04 0.04 0.04"
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
          simple-navmesh-constraint="navmesh:#hallway; fall:0.5; height:1.65;"
        />

        <!-- The avatars -->
        <a-entity
          ref="avatars"
        >
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
  </div>
</template>

<script setup lang="ts">
import 'aframe';
import type { Entity } from 'aframe';
import { type Ref, ref, onMounted } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import { client, startLoggedInClient  } from '@/modules/trpcClient';
import type { ConnectionId, ClientTransform, ClientTransforms } from 'schemas';
import type { Unsubscribable } from '@trpc/server/observable';
import { useClientStore } from '@/stores/clientStore';

// Stores
const clientStore = useClientStore();

// Server, Client, etc.
// let client :ReturnType<typeof getClient>;
const selfId = ref<ConnectionId>();
const clientTransforms = ref<ClientTransforms>({});
const avatars = ref<Entity>();

onMounted(async () => {

  startTransformSubscription();

  client.value.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      console.log(data);
      // Object.keys(data).forEach(id => {

      // }

    },
  });

  // Clear clients on C key down
  window.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
      clearClientTransforms();
    }
  });

});

let transformSubscription: Unsubscribable | undefined = undefined;
function startTransformSubscription() {
  if(transformSubscription){
    transformSubscription.unsubscribe();
  }
  transformSubscription = client.value.vr.transforms.subClientTransforms.subscribe(undefined, {
    onData(data) {
      clientStore.clientTransforms = {...clientStore.clientTransforms, ...data};
      // console.log('received transform data!', data, clientStore.clientTransforms);
    },
  });
  console.log('Subscribe to client transforms',transformSubscription);
}

async function clearClientTransforms() {
  clientStore.clientTransforms = {};
  // await client.vr.transforms..mutate();
}

// Load a-frame assets
const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
}

// Move callbacks

async function cameraMoveSlow (e: CustomEvent<[number, number, number]>){
  const positionStr = e.detail;
  // console.log('Camera move slow', positionStr);
  if(client){
    const position: ClientTransform['position'] = e.detail;
    const randomRot: ClientTransform['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
    await client.value.vr.transforms.updateTransform.mutate({orientation: randomRot, position});
  }
}

const cameraPosition = ref([0,0,0] as [number, number, number]);
function cameraMoveFast (e: CustomEvent<[number, number, number]>){
  cameraPosition.value = e.detail;
}

</script>
