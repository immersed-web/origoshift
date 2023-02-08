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
            v-for="avatar in remoteData"
            :key="avatar.id"
            :id="'avatar-'+avatar.id"
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

// Load a-frame assets
const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
  console.log('loaded assets', loaded.value);
}

function cameraMoveSlow (e: CustomEvent<string>){
  const position = e.detail;
  console.log('Camera move slow', position);
}

function cameraMoveFast (e: CustomEvent<string>){
  const position = e.detail;
  // console.log('Camera move fast', position);
  remoteData.value.forEach(a => {
    const el = avatars.value?.querySelector<Entity>('#avatar-'+a.id);
    if(el)
      el.emit('cameraPosition', {position: position.split(' ')});
  });

}

// Remote avatars

// Dummy data structure for position subscription updates
type RemoteAvatarData = {
  id: string,
  position: [number, number, number]
}

onMounted(() => {
  // Simulate backend position subscription updates
  randomizeRemoteData();
  setInterval(randomizeRemoteData, 1000);
});

// Generate a random position as dummy data
function randomizePosition() : [number, number, number] {
  return [(Math.random() * 4 - 2) + 2, 2, (Math.random() * 4 - 2) - 2];
}

const avatars = ref<Entity>();
const remoteData = ref<RemoteAvatarData[]>([]);

// Simulate backend position subscription update
function randomizeRemoteData() {

  // 3 avatars with random positions
  remoteData.value = [
    {id: 'A', position: randomizePosition()},
    {id: 'B', position: randomizePosition()},
    {id: 'C', position: randomizePosition()},
  ];

  // Send event 'moveTo-id' to each respective avatar
  remoteData.value.forEach(a => {
    const el = avatars.value?.querySelector<Entity>('#avatar-'+a.id);
    if(el)
      el.emit('moveTo', {position: a.position});
  });
}

</script>
