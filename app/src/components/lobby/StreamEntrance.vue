<template>
  <a-entity id="entrance-rig">
    <a-entity
      :rotation="`0 ${props.direction} 0`"
      position="0 1.4 0"
    >
      <a-plane
        color="fuchsia"
        side="double"
      />
      <a-text :value="props.message" />
      <a-text
        rotation="0 180 0"
        :value="props.message"
      />
    </a-entity>
  </a-entity>
</template>
<script setup lang="ts">
  
defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  direction: number,
  message: string
}>();

</script>