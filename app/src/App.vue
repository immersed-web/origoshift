<template>
  <RouterView />
</template>
<script setup lang="ts">

// import socket from './modules/WebSocket';
// console.log(socket.readyState);
import { useUserStore } from 'stores/userStore';
const userStore = useUserStore();
window.addEventListener('click', () => { userStore.firstInteractionDone = true; });

</script>
