<template>
  <router-view />
</template>
<script setup lang="ts">

import socket from './modules/WebSocket';
console.log(socket.readyState);

</script>
