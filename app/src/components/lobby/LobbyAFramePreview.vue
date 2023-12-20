<template>
  <a-scene
    embedded
    ref="sceneTag"
    id="ascene"
    xr-mode-ui="enabled: false"
    cursor__mouse="fuse:false; rayOrigin: mouse; mouseCursorStylesEnabled: true"
    raycaster="objects: #navmesh"
  >
    <a-assets
      v-once
    >
      <a-asset-item
        id="model-asset"
        :src="props.modelUrl"
      />
      <a-asset-item
        id="navmesh-asset"
        :src="props.navmeshUrl"
      />
    </a-assets>
    <StreamEntrance
      v-if="entrancePosString"
      :position="entrancePosString"
      :direction="entranceRotation"
      message="Yoooooooo vad har du i kikaren??"
    />
    <a-entity
      v-if="spawnPosString"
      :position="spawnPosString"
    >
      <a-circle
        color="yellow"
        transparent="true"
        opacity="0.5"
        rotation="-90 0 0"
        position="0 0.05 0"
        :radius="spawnRadius"
      />
    </a-entity>

    <!-- for some super weird reason orbit controls doesnt work with the a-camera primitive  -->
    <a-entity
      camera
      ref="cameraTag"
    />
    <a-sky color="lightskyblue" />
      
    <a-entity
      ref="cursorTag"
      :visible="false"
    >
      <a-ring
        position="0 0.01 0"
        rotation="-90  0 0"
        radius-inner="0.1"
        radius-outer="0.2"
      />
    </a-entity>

    <!-- The model -->
    <a-entity>
      <a-gltf-model
        @model-loaded="onModelLoaded"
        id="model"
        ref="modelTag"
        src="#model-asset"
      />
      <a-gltf-model
        id="navmesh"
        ref="navmeshTag"
        src="#navmesh-asset"
        @raycast-change="onIntersection"
        @raycast-out="onNoIntersection"
        @click="placeCursor"
      />
    </a-entity>
  </a-scene>
</template>

<script setup lang="ts">
import { type Scene, type Entity, type DetailEvent, THREE } from 'aframe';
import { ref, watch, computed }  from 'vue';
import { useTimeoutFn } from '@vueuse/core';
import StreamEntrance from './StreamEntrance.vue';
import { useVenueStore } from '@/stores/venueStore';


const venueStore = useVenueStore();

const props = withDefaults(defineProps<{
  modelUrl?: string,
  navmeshUrl?: string,
  cursorTarget?: 'spawnPosition' | 'entrancePosition' | undefined
}>(), {
  modelUrl: '',
  navmeshUrl: '',
  cursorTarget: undefined,
});


const emit = defineEmits<{
  'cursorPlaced': [point: [number, number, number]]
}>();

// A-frame
const sceneTag = ref<Scene>();
const modelTag = ref<Entity>();
const navmeshTag = ref<Entity>();
const cameraTag = ref<Entity>();
const cursorTag = ref<Entity>();

let stopAutoRotateTimeout: ReturnType<typeof useTimeoutFn>['stop'] | undefined = undefined;

watch(() => props.cursorTarget, (cTarget) => {
  if(cTarget) {
    if(stopAutoRotateTimeout) stopAutoRotateTimeout();
    navmeshTag.value?.setAttribute('raycaster-listen', true);
    cameraTag.value!.setAttribute('orbit-controls', 'autoRotate', false);
  } else {
    navmeshTag.value?.removeAttribute('raycaster-listen');
    stopAutoRotateTimeout = useTimeoutFn(() => {
      cameraTag.value!.setAttribute('orbit-controls', 'autoRotate', true);
    }, 5000).stop;
  }
});
const entrancePosString = computed(() => {
  const posArr = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.entrancePosition;
  if(!posArr) return undefined;
  const v = new AFRAME.THREE.Vector3(...posArr as [number, number, number]);
  return AFRAME.utils.coordinates.stringify(v);
});

const entranceRotation = computed(() => {
  if(!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.entranceRotation) return 0;
  return venueStore.currentVenue.vrSpace.virtualSpace3DModel.entranceRotation;
});

const spawnPosString = computed(() => {
  const posArr = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.spawnPosition;
  if(!posArr) return undefined;
  const v = new AFRAME.THREE.Vector3(...posArr as [number, number, number]);
  return AFRAME.utils.coordinates.stringify(v);
});

const spawnRadius = computed(() => {
  if(!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.spawnRadius) return 0;
  return venueStore.currentVenue.vrSpace.virtualSpace3DModel.spawnRadius;
});

function onIntersection(evt: DetailEvent<any>){
  // console.log('model hovered',evt);
  const point: THREE.Vector3 = evt.detail.point;
  if(!point) {
    console.error('no point from intersection event');
    return;
  }
  if(props.cursorTarget === 'spawnPosition'){
    if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel){
      venueStore.currentVenue.vrSpace.virtualSpace3DModel.spawnPosition = point.toArray();
    }
  }
  if(props.cursorTarget === 'entrancePosition'){
    if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel){
      venueStore.currentVenue.vrSpace.virtualSpace3DModel.entrancePosition = point.toArray();
    }
  }
  // if(!cursorTag.value) return;
  // cursorTag.value?.setAttribute('visible', props.isCursorActive); 
  // cursorTag.value.object3D.position.set(...point.toArray());
}

function onNoIntersection(evt: DetailEvent<any>){
  console.log('raycast-out');
  // if(!cursorTag.value) return;
  // cursorTag.value?.setAttribute('visible', false); 
}

function placeCursor(evt: DetailEvent<{intersection: {point: THREE.Vector3}}>){
  console.log(evt.detail.intersection);
  emit('cursorPlaced', evt.detail.intersection.point.toArray());
}

function onModelLoaded(){
  if(modelTag.value && cameraTag.value){
    console.log('centering camera on model bbox');
    // const obj3D = modelTag.value.components.mesh;
    // const obj3D = modelTag.value.object3DMap;
    const obj3D = modelTag.value.getObject3D('mesh');
    console.log(obj3D);
    
    const bbox = new THREE.Box3().setFromObject(obj3D);
    const modelCenter = bbox.getCenter(new THREE.Vector3());
    // cameraTag.value.object3D.position.set(modelCenter.x, modelCenter.y, modelCenter.z);

    let orbitControlSettings = `autoRotate: true; rotateSpeed: 1; initialPosition: ${modelCenter.x} ${modelCenter.y+2} ${modelCenter.z+5};`;
    orbitControlSettings += `target:${modelCenter.x} ${modelCenter.y} ${modelCenter.z};`;
    cameraTag.value.setAttribute('orbit-controls', orbitControlSettings);
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
