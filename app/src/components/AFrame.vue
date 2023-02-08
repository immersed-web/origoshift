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

      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <a-camera
        look-controls
        wasd-controls="acceleration:100;"
        emit-move="interval: 1000"
        @move="cameraMove"
        simple-navmesh-constraint="navmesh:#dungeon; fall:0.5; height:1.65;"
      />

      <!-- <a-camera
        look-controls
        wasd-controls="acceleration:100;"
        emit-move="interval: 1000"
        @move="cameraMove"
      /> -->

      <!-- Venue model -->
      <!-- <a-entity v-if="loaded">
        <a-entity
          id="venue"
          gltf-model="#venue-asset"
        />

        <a-entity
          id="venue_navmesh"
          gltf-model="#venue_navmesh-asset"
          visible="false"
        />
      </a-entity> -->

      <!-- Dungeon model -->
      <a-entity v-if="loaded">
        <a-entity
          id="dungeon"
          gltf-model="#dungeon-asset"
          color="red"
        />

        <a-entity
          id="dungeon_navmesh"
          gltf-model="#dungeon_navmesh-asset"
          visible="true"
        />
      </a-entity>

      <!-- <a-entity v-if="loaded">
        <a-entity
          id="hallway"
          gltf-model="#hallway-asset"
          scale="0.1 0.1 0.1"
        />
      </a-entity> -->

      <!-- The avatars -->
      <RemoteAvatar />
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import 'aframe';
import { ref } from 'vue';
import RemoteAvatar from './RemoteAvatar.vue';

const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
  console.log('loaded assets', loaded.value);
}

function cameraMove (e: CustomEvent<string>){

  const position = e.detail;

  console.log('Camera move', position);
}

</script>
