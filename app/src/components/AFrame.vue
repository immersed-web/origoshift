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
          src="/models/venue/scene.gltf"
        />
        <a-asset-item
          id="venue_navmesh-asset"
          src="/models/venue_navmesh/scene.gltf"
        />
      </a-assets>

      <a-sky color="#ECECEC" />

      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <a-camera
        look-controls
        wasd-controls="acceleration:100;"
        emit-move="interval: 1000"
        @move="cameraMove"
        simple-navmesh-constraint="navmesh:#venue_navmesh; fall:0.5; height:1.65;"
      />

      <a-entity v-if="loaded">
        <!-- The venue model -->
        <a-entity
          id="venue"
          gltf-model="#venue-asset"
        />

        <!-- The navmesh, this should not be rendered. How to do? -->
        <a-entity
          id="venue_navmesh"
          gltf-model="#venue_navmesh-asset"
          visible="false"
        />
      </a-entity>
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import 'aframe';
import { ref } from 'vue';

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
