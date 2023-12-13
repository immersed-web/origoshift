<template>
  <a-entity
    id="entrance-rig"
    v-bind="$attrs"
  >
    <a-entity
      :rotation="`0 ${props.direction} 0`"
      position="0 1.4 0"
    >
      <a-plane
        :class="$attrs['class']"
        color="fuchsia"
        side="double"
        width="1.6"
        height="2"
      />
      <!-- <a-entity
        :class="$attrs['class']"
        geometry="primitive: plane; width: 1; height: 2;"
        material="color: yellow"
        rotation="0 0 0"
        :text="`align: center; value: ${props.message};`"
      /> -->
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