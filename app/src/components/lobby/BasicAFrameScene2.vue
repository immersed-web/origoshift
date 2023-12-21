<template>
  <Teleport
    v-if="domOutlet"
    :to="domOutlet"
  >
    <p v-if="!showScene">
      Yooooo!
    </p>
    <input
      type="checkbox"
      class="toggle"
      v-model="showScene"
    >
  </Teleport>
  <template v-if="showScene">
    <a-entity laser-controls="hand:right" />
    <a-camera />
    <a-box
      position="-1 0.5 -3"
      rotation="0 90 0"
      color="yellow"
      @click="goToOtherScene"
    />
    <a-sphere
      position="0 1.25 -5"
      radius="1.25"
      color="purple"
    />
    <a-cylinder
      position="1 1.25 -3"
      radius="0.5"
      height="1.5"
      color="skyblue"
    />
    <a-plane
      position="0 0 -4"
      rotation="-90 0 0"
      width="4"
      height="4"
      color="#7BC8A4"
    />
    <a-sky color="black" />
  </template>
</template>
<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';
const router = useRouter();
const showScene = ref(true);

const { sceneTag, domOutlet } = inject(aFrameSceneProvideKey)!;
onMounted(() => {
  console.log(sceneTag.value);
  sceneTag.value?.setAttribute('cursor', {fuse: false, rayOrigin: 'mouse'});
});

function goToOtherScene() {
  console.log('sphere clicked');
  router.push({name: 'basicVR'});
}
</script>