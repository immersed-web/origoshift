<template>
  <h1>Watching camera: {{ props.cameraId }}</h1>
</template>

<script setup lang="ts">
import type { CameraId } from 'schemas';


const props = defineProps<{
  cameraId: CameraId
}>();

</script>
