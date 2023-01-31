<template>
  <div>
    A-frame
    <a-scene cursor="rayOrigin: mouse">

      <a-entity camera look-controls wasd-controls position="0 1.6 0" emit-move="interval: 1000" @move="cameraMove" />

      <a-assets>
        <img id="groundTexture" src="https://cdn.aframe.io/a-painter/images/floor.jpg">
      </a-assets>
      <a-box position="0 2 -5" rotation="0 45 45" scale="1 1 1"
         animation="property: object3D.position.y; to: 2.2; dir: alternate; dur: 2000; loop: true"></a-box>
      <a-plane src="#groundTexture" rotation="-90 0 0" width="30" height="30" repeat="10 10"></a-plane>

      <a-sky color="#ECECEC"></a-sky>
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
