<template>
  <div
    ref="domOutlet"
    id="aframe-dom-outlet"
  />
  <a-scene
    class="w-full h-[40rem]"
    embedded
    ref="sceneTag"
  >
    <a-assets
      timeout="20000"
    >
      <a-asset-item
        id="avatar-asset"
        src="/models/avatar/Character_Base_Mesh_5.glb"
      />
    </a-assets>
    <RouterView v-slot="{Component}">
      <component
        :is="Component"

        @vue:before-unmount="onViewUnmounted"
      />
    </RouterView>
  </a-scene>
  <div class="grid grid-flow-col gap-2">
    <RouterLink :to="{name: 'basicVR'}">
      Basic VR
    </RouterLink>
    <RouterLink :to="{name: 'basicVR2'}">
      Basic VR 2
    </RouterLink>
    <RouterLink :to="{name: 'userLobby'}">
      Lobby
    </RouterLink>
  </div>
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