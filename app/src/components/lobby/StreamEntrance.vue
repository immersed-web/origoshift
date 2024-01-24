<template>
  <a-entity
    id="entrance-rig"
    v-bind="$attrs"
  >
    <a-entity
      :rotation="`0 ${props.direction} 0`"
      position="0 1.3 0"
    >
      <a-plane
        :class="$attrs['class']"
        color="black"
        side="double"
        width="1.6"
        height="2"
      />
      <a-text
        align="center"
        rotation="0 180 0"
        wrap-count="20"
        width="1.6"
        :value="props.message"
      />
      <a-text
        align="center"
        wrap-count="20"
        width="1.6"
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