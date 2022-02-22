<template>
  <div>
    <!-- <QBtn
      label="censorShield"
      @click="toggle"
    /> -->
    <QBtn
      icon="filter_b_and_w"
      round
      @click="invert"
    />
    <QRange v-model="localState.range" />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

const localState = reactive<{range: {min: number, max: number}, inverted: boolean }>({
  // enabled: false,
  inverted: false,
  range: {
    min: 0,
    max: 100,
  },
});
defineExpose();

// const asRefs = toRefs(localState);
// defineExpose({ localState });

interface CensorControlEmits {
  (e: 'update', values: typeof localState): void
}
const emit = defineEmits<CensorControlEmits>();

watch(localState, (newState) => {
  emit('update', newState);
});

// function toggle () {
//   console.log('censorshield toggled');
//   localState.enabled = !localState.enabled;
// }

function invert () {
  console.log('range inverted!');
  localState.inverted = !localState.inverted;
}
</script>
