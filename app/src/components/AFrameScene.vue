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
      <a-asset-item
        id="avatar-asset"
        src="/models/avatar/body/Body1.glb"
      />
      <a-mixin
        id="fade-to-from-black"
        animation__to_black="property: components.material.material.color; type: color; to: #000; dur: 500; startEvents: fadeToBlack; easing: linear;"
        animation__from_black="property: components.material.material.color; type: color; to: #fff; dur: 500; startEvents: fadeFromBlack; easing: linear;"
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