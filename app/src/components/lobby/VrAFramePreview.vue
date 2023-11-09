<template>
  <a-scene
    embedded
    cursor="rayOrigin: mouse"
    ref="scene"
    cont
    id="ascene"
    vr-mode-ui="enabled: false"
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
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
      />
      <a-entity
        id="navmesh"
        gltf-model="#navmesh-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
        visible="false"
      />
    </a-entity>

    <!-- Avatar wrapper element -->
    <a-entity position="2 0 0">
      <!-- The camera / own avatar -->
      <!-- The navmesh needs to refer to the actual entity, not only the asset -->
      <a-camera
        look-controls
        wasd-controls="acceleration:100;"
        position="0 2 0"
        :simple-navmesh-constraint="'navmesh:#'+navmeshId+'; fall:0.5; height:1.65;'"
      />
    </a-entity>
  </a-scene>
</template>

<script setup lang="ts">
import 'aframe';
import type { Scene } from 'aframe';
import { ref, computed } from 'vue';

// Props & emits
const props = defineProps({
  modelUrl: {type: String, default: ''},
  navmeshUrl: {type: String, default: ''},
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

// Load a-frame assets
const loaded = ref(false);

function onLoaded () {
  loaded.value = true;
}

</script>

<style scoped>

#ascene {
  height: 0;
  padding-top: 56.25%;
}

</style>
