<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
// import { Switch } from '@headlessui/vue';
// import { ListGroup, ListGroupItem, Button } from 'flowbite-vue';
import { ref } from 'vue';
import { white } from 'tailwindcss/colors';

// Register a-frame components
import components from './ts/aframe/components'
components.registerComponents()

const switchValue = ref<boolean>(false);

const loading = ref<boolean>(false);

const currentTab = ref<string>('');
function clicked() {
  console.log('clicked');
}
function hovered() {
  console.log('hovered');
}
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
