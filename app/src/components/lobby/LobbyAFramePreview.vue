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

    <!-- for some super weird reason orbit controls doesnt work with the a-camera primitive  -->
    <a-entity
      camera
      ref="cameraTag"
    />
    <a-sky color="lightskyblue" />
      
    <a-entity
      ref="cursorTag"
      :visible="props.isCursorActive"
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
import StreamEntrance from './StreamEntrance.vue';
import { useVenueStore } from '@/stores/venueStore';


const venueStore = useVenueStore();

const props = withDefaults(defineProps<{
  modelUrl?: string,
  navmeshUrl?: string,
  isCursorActive?: boolean
}>(), {
  modelUrl: '',
  navmeshUrl: '',
  isCursorActive: false,
});

watch(() => props.isCursorActive, (cursorActive) => {
  if(cursorActive) {
    navmeshTag.value?.setAttribute('raycaster-listen', true);
    cameraTag.value?.components['orbit-controls'].pause();
  } else {
    navmeshTag.value?.removeAttribute('raycaster-listen');
    cameraTag.value?.components['orbit-controls'].play();
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

const emit = defineEmits<{
  'cursorPlaced': [point: [number, number, number]]
}>();

// A-frame
const sceneTag = ref<Scene>();
const modelTag = ref<Entity>();
const navmeshTag = ref<Entity>();
const cameraTag = ref<Entity>();
const cursorTag = ref<Entity>();

// const modelUrl = computed(() => {
//   return props.modelUrl;
// });

// const navmeshId = computed(() => {
//   return props.navmeshUrl !== '' ? 'navmesh' : 'model';
// });

function onIntersection(evt: DetailEvent<any>){
  // console.log('model hovered',evt);
  if(!cursorTag.value) return;
  cursorTag.value?.setAttribute('visible', props.isCursorActive); 
  const point: THREE.Vector3 = evt.detail.point;
  if(!point) {
    console.error('no point from intersection event');
    return;
  }
  cursorTag.value.object3D.position.set(...point.toArray());
}

function onNoIntersection(evt: DetailEvent<any>){
  console.log('raycast-out');
  if(!cursorTag.value) return;
  cursorTag.value?.setAttribute('visible', false); 
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
