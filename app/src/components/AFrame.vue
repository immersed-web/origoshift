<template>
  <div>
    A-frame
    <a-scene cursor="rayOrigin: mouse">

      <a-assets @loaded="onLoaded">
        <img id="groundTexture" src="https://cdn.aframe.io/a-painter/images/floor.jpg">
        <!-- <a-asset-item id="dungeon" src="/models/nav_test.obj"></a-asset-item> -->
        <a-asset-item id="dung" src="/models/dung22.gltf"></a-asset-item>
        <a-asset-item id="venue-asset" src="/models/venue/scene.gltf"></a-asset-item>
        <a-asset-item id="venue_navmesh-asset" src="/models/venue_navmesh/scene.gltf"></a-asset-item>
      </a-assets>

      <a-sky color="#ECECEC"></a-sky>

      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <a-camera look-controls wasd-controls="acceleration:100;"
        emit-move="interval: 1000" @move="cameraMove"
        simple-navmesh-constraint="navmesh:#venue_navmesh; fall:0.5; height:1.65;"
        />

      <a-entity v-if="loaded">
        <!-- The venue model -->
        <a-entity id="venue" gltf-model="#venue-asset"></a-entity>

        <!-- The navmesh, this should not be rendered. How to do? -->
        <a-entity id="venue_navmesh" gltf-model="#venue_navmesh-asset"></a-entity>
      </a-entity>

    </a-scene>
  </div>
</template>

<script setup lang="ts">
import 'aframe'
import type { AFrame, ThreeLib } from 'aframe';
import { onBeforeMount, ref } from 'vue'

// import components from '../ts/components'
// components.registerComponents()
onBeforeMount(() => {
  // components.registerComponents()
})

const loaded = ref(false)

function onLoaded () {
  loaded.value = true
  console.log('loaded assets', loaded.value)
}

function cameraMove (e: CustomEvent<string>){

  const position = e.detail

  console.log("Camera move", position)
}

</script>
