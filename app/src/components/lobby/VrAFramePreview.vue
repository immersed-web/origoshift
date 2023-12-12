<template>
  <a-scene
    embedded
    ref="sceneTag"
    id="ascene"
    xr-mode-ui="enabled: false"
  >
    <a-assets
      v-once
    >
      <a-asset-item
        id="model-asset"
        :src="modelUrl"
      />
      <a-asset-item
        id="navmesh-asset"
        :src="navmeshUrl"
      />
    </a-assets>

    <!-- for some super weird reason orbit controls doesnt work with the a-camera primitive  -->
    <a-entity
      camera
      ref="cameraTag"
    />
    <a-sky color="lightskyblue" />

    <!-- The model -->
    <a-entity>
      <a-gltf-model
        @model-loaded="onModelLoaded"
        id="model"
        ref="modelTag"
        src="#model-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
      />
      <a-gltf-model
        id="navmesh"
        src="#navmesh-asset"
        :scale="modelScale + ' ' + modelScale + ' ' + modelScale"
        visible="false"
      />
    </a-entity>
  </a-scene>
</template>

<script setup lang="ts">
// import 'aframe';
import { type Scene, type Entity, THREE } from 'aframe';
import { ref, computed } from 'vue';

// Props & emits
const props = defineProps({
  modelUrl: {type: String, default: ''},
  navmeshUrl: {type: String, default: ''},
  modelScale: {type: Number, default: 1},
});

// A-frame
const sceneTag = ref<Scene>();
const modelTag = ref<Entity>();
const cameraTag = ref<Entity>();

const modelUrl = computed(() => {
  return props.modelUrl;
});

// const navmeshId = computed(() => {
//   return props.navmeshUrl !== '' ? 'navmesh' : 'model';
// });

function onModelLoaded(){
  if(modelTag.value && cameraTag.value){
    console.log('centering camera on model bbox');
    // const obj3D = modelTag.value.components.mesh;
    // const obj3D = modelTag.value.object3DMap;
    const obj3D = modelTag.value.getObject3D('mesh');
    console.log(obj3D);
    
    const bbox = new THREE.Box3().setFromObject(obj3D);
    const modelCenter = bbox.getCenter(new THREE.Vector3());
    // cameraRigTag.value.object3D.position.set(modelCenter.x, modelCenter.y, modelCenter.z);

    let orbitControlSettings = `autoRotate: true; rotateSpeed: 1; initialPosition: ${modelCenter.x} ${modelCenter.y+2} ${modelCenter.z+5};`;
    orbitControlSettings += `target:${modelCenter.x} ${modelCenter.y} ${modelCenter.z};`;
    cameraTag.value.setAttribute('orbit-controls', orbitControlSettings);
    // cameraTag.value.setAttribute('orbit-controls', 'initialPosition', '0  0');
    // cameraTag.value.setAttribute('orbit-controls', );
    // cameraTag.value.setAttribute('orbit-controls', 'enabled', 'true');
    // console.log(modelCenter);
  }
  
  // Below is testcode for trying out the built-in equirectangular screen capture of aframe scene
  // if(sceneTag.value){
  //   const screenshotComponent = sceneTag.value.components.screenshot;
  //   // @ts-ignore
  //   const canvasScreenshot = screenshotComponent.getCanvas();
  //   console.log(canvasScreenshot);

  //   // @ts-ignore
  //   screenshotComponent.saveCapture();
  // }
}

</script>

<style scoped>

#ascene {
  height: 0;
  padding-top: 56.25%;
}

</style>
