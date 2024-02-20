<template>
  <div class="w-screen h-screen pointer-events-none z-10 absolute">
    <div class="rounded-br-lg bg-base-200/50 max-w-fit p-4 *:pointer-events-auto">
      <button
        @click="$router.back()"
        class="btn btn-primary btn-circle"
      >
        <span class="material-icons">arrow_back</span>
      </button>
    </div>
    <div
      class="pointer-events-none *:pointer-events-auto"
      ref="domOutlet"
      id="aframe-dom-outlet"
    />
  </div>
  <div
    v-if="!bundlesLoaded"
    class="grid place-items-center h-screen w-screen"
  >
    <div class="flex flex-col items-center animate-pulse">
      <h2 class="">
        LADDAR COOLA 3D-GREJER
      </h2>
      <span class="loading loading-lg loading-infinity text-primary" />
    </div>
  </div>
  <a-scene
    v-else
    class="pointer-events-auto w-screen h-screen"
    ref="sceneTag"
  >
    <a-assets
      timeout="20000"
    >
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
    <RouterView v-slot="{Component}">
      <component
        :is="Component"
        @vue:before-unmount="onViewUnmounted"
      />
    </RouterView>
  </a-scene>
</template>
<script setup lang="ts">
import { onBeforeMount, provide, ref } from 'vue';
// this makes sure aframe is loaded before mounting the scene
import type { Scene } from 'aframe';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';

const bundlesLoaded = ref(false);

const sceneTag = ref<Scene>();
const domOutlet = ref<HTMLDivElement>();
provide(aFrameSceneProvideKey, {sceneTag, domOutlet});
onBeforeMount( async () => {
  console.log('onbeforeMount in AFRAME SCENE');
  await import('aframe');
  const {default: c} = await import('@/ts/aframe/components');
  c.registerAframeComponents();
  bundlesLoaded.value = true;
});

function onViewUnmounted(input: unknown) {
  // sceneTag.value?.removeAttribute('cursor');
  // sceneTag.value?.removeAttribute('raycaster');
  // console.log('view unmounteed');
  // console.log(input);
}
</script>