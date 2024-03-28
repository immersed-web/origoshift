<template>
  <div v-once class="relative bg-slate-300">
    <a-scene>
       <a-assets v-once timeout="20000" @loaded="onAssetsLoaded">
        <!-- TODO: Find a nice way to dynamically load the models we need. Preferably only when entering lobby and not 360-stream. -->
        <a-asset-item
          id="avatar-body-1"
          src="/models/avatar/body/Body1.glb"
        />

        <a-asset-item
          id="avatar-eyes-1"
          src="/models/avatar/eyes/Eyes1.glb"
        />
        <a-asset-item
          id="avatar-eyes-2"
          src="/models/avatar/eyes/Eyes2.glb"
        />
        <a-asset-item
          id="avatar-eyes-3"
          src="/models/avatar/eyes/Eyes3.glb"
        />
        <a-asset-item
          id="avatar-eyes-4"
          src="/models/avatar/eyes/Eyes4.glb"
        />
        <a-asset-item
          id="avatar-eyes-5"
          src="/models/avatar/eyes/Eyes5.glb"
        />

        <a-asset-item
          id="avatar-hand-1"
          src="/models/avatar/hands/low_poly_gloved_hand.glb"
        />

        <a-asset-item
          id="avatar-hat-1"
          src="/models/avatar/hat/Hat1.glb"
        />
        <a-asset-item
          id="avatar-hat-2"
          src="/models/avatar/hat/Hat2.glb"
        />
        <a-asset-item
          id="avatar-hat-3"
          src="/models/avatar/hat/Hat3.glb"
        />
        <a-asset-item
          id="avatar-hat-4"
          src="/models/avatar/hat/Hat4.glb"
        />

        <a-asset-item
          id="avatar-head-1"
          src="/models/avatar/head/Head1.glb"
        />

        <a-asset-item
          id="avatar-mouth-1"
          src="/models/avatar/mouth/Mouth1.glb"
        />
        <a-asset-item
          id="avatar-mouth-2"
          src="/models/avatar/mouth/Mouth2.glb"
        />
        <a-asset-item
          id="avatar-mouth-3"
          src="/models/avatar/mouth/Mouth3.glb"
        />
        <a-asset-item
          id="avatar-mouth-4"
          src="/models/avatar/mouth/Mouth4.glb"
        />
        <a-asset-item
          id="avatar-mouth-5"
          src="/models/avatar/mouth/Mouth5.glb"
        />
        <a-asset-item
          id="avatar-mouth-6"
          src="/models/avatar/mouth/Mouth6.glb"
        />
        <a-asset-item
          id="avatar-mouth-7"
          src="/models/avatar/mouth/Mouth7.glb"
        />

        <a-asset-item
          id="avatar-vehicle-1"
          src="/models/avatar/vehicle/Vehicle1.glb"
        />
      </a-assets>
      <a-sky color="grey" />
      <!-- <a-box position="0 0 -3" color="red" /> -->
      <a-entity position="0 1.6 -1.5" id="avatar-root">
        <a-entity id="avatar-origin">
          <a-entity gltf-model="#avatar-hat-1" id="top" />
          <a-entity gltf-model="#avatar-head-1" id="skull" />
          <a-entity gltf-model="#avatar-eyes-1" id="eyes" />
          <a-entity gltf-model="#avatar-mouth-1" id="mouth" />

        </a-entity>
        <a-entity id="lower-part">
          <!-- <a-entity gltf-model="#avatar-body-1" id="body" /> -->
          <a-gltf-model src="/models/avatar/body/Body1.glb" id="body" />
          <a-entity gltf-model="#avatar-vehicle-1" id="vehicle" />
        </a-entity>

      </a-entity>
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import 'aframe';
import { ref } from 'vue';
import c from '@/ts/aframe/components';
c.registerAframeComponents();

function onAssetsLoaded() {
  console.log('Assets finished loading');
  assetsLoaded.value = true;
}

// const bundlesLoaded = ref(false);
const assetsLoaded = ref(false);
// onBeforeMount( async () => {
//   console.log('onbeforeMount in AFRAME SCENE');
//   await import('aframe');
//   const {default: c} = await import('@/ts/aframe/components');
//   c.registerAframeComponents();
//   bundlesLoaded.value = true;
// });
</script>