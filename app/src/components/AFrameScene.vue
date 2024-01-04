<template>
  <div class="w-screen h-screen pointer-events-none *:pointer-events-auto z-10 absolute">
    <div class="rounded-br-lg bg-base-200/50 max-w-fit p-4">
      <button
        @click="$router.back()"
        class="btn btn-primary btn-circle"
      >
        <span class="material-icons">arrow_back</span>
      </button>
    </div>
    <div
      class=""
      ref="domOutlet"
      id="aframe-dom-outlet"
    />
  </div>
  <a-scene
    class="pointer-events-auto w-screen h-screen"
    ref="sceneTag"
  >
    <a-assets
      timeout="20000"
    >
      <a-asset-item
        id="avatar-asset"
        src="/models/avatar/Character_Base_Mesh_5.glb"
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
import { provide, ref } from 'vue';
import type { Ref } from 'vue';
// this makes sure aframe is loaded before mounting the scene
import 'aframe';
import type { Scene } from 'aframe';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';
import c from '@/ts/aframe/components';
c.registerAframeComponents();

const sceneTag = ref<Scene>();
const domOutlet = ref<HTMLDivElement>();
provide(aFrameSceneProvideKey, {sceneTag, domOutlet});

function onViewUnmounted(input: unknown) {
  sceneTag.value?.removeAttribute('cursor');
  sceneTag.value?.removeAttribute('raycaster');
  // console.log('view unmounteed');
  // console.log(input);
}
</script>