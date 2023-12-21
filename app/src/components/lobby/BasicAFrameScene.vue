<template>
  <a-entity laser-controls="hand:right" />
  <a-camera />
  <a-box
    position="-1 0.5 -3"
    rotation="0 45 0"
    color="#4CC3D9"
  />
  <a-sphere
    position="0 1.25 -5"
    radius="1.25"
    color="#EF2D5E"
    @click="goToOtherScene"
  />
  <a-cylinder
    position="1 0.75 -3"
    radius="0.5"
    height="1.5"
    color="#FFC65D"
    @click="goToLobby"
  />
  <a-plane
    position="0 0 -4"
    rotation="-90 0 0"
    width="4"
    height="4"
    color="#7BC8A4"
  />
  <a-sky color="#ECECEC" />
</template>
<script setup lang="ts">
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';
import { inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const {sceneTag} = inject(aFrameSceneProvideKey)!;

const router = useRouter();

onMounted(() => {
  console.log(sceneTag.value);
  sceneTag.value?.setAttribute('cursor', {fuse: false, rayOrigin: 'mouse'});
});

function goToOtherScene() {
  console.log('sphere clicked');
  router.push({name: 'basicVR2'});
}
function goToLobby() {
  router.push({name: 'userLobby'});
}
</script>