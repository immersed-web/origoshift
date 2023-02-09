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
          emit-move="intervals: 100 1000"
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
            v-for="key in Object.keys(remoteAvatarsData)"
            :key="key"
            :id="'avatar-'+key"
          />
        </a-entity>
      </a-entity>
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import 'aframe';
import type { Entity } from 'aframe';
import { ref, onMounted } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';
import { getClient, type RouterOutputs  } from '@/modules/trpcClient';
import type { ClientTransform } from 'schemas';

// Server, Client, etc.
let client : Awaited<ReturnType<typeof getClient>>
const remoteAvatarsData = ref({});
const avatars = ref<Entity>();

onMounted(async () => {
  client = await getClient();
  console.log("Client", client)
  const sub = client.vr.transforms.clientTransformsSub.subscribe(undefined, {
    onData(data){
      remoteAvatarsData.value = data;
      for(const key in data){
        handleRemoteAvatarData(key, data[key]);
      }
    },
  });
})

// Handle single remote client data, called on subscription update
function handleRemoteAvatarData(id: string, transform : ClientTransform) {
  const el = avatars.value?.querySelector<Entity>('#avatar-'+id);
    if(el){
      el.emit('moveTo', {position: transform.position});
    }
}

// Load a-frame assets
const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
}

// Move callbacks

async function cameraMoveSlow (e: CustomEvent<string>){
  const positionStr = e.detail;
  // console.log('Camera move slow', positionStr);
  if(client){
    const position: ClientTransform['position'] = positionStr.split(' ').map(c => parseFloat(c)) as [number, number, number]
    const randomRot: ClientTransform['orientation'] = [Math.random(),Math.random(),Math.random(),Math.random()];
    await client.vr.transforms.updateTransform.mutate({orientation: randomRot, position});
  }
}

function cameraMoveFast (e: CustomEvent<string>){
  const positionStr = e.detail;
  // console.log('Camera move fast', positionStr);

  // Update camera (self avatar) position for each local RemoteAvatar
  // Used to handle distance calculations etc.
  Object.keys(remoteAvatarsData.value).forEach(id => {
    const el = avatars.value?.querySelector<Entity>('#avatar-'+id);
    if(el)
      el.emit('cameraPosition', {position: positionStr.split(' ')});
  });

}

</script>
