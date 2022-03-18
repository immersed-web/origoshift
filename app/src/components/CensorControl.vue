<template>
  <div>
    <QToggle
      v-model="localState.enabled"
      :label="`censorshield ${localState.enabled?'enabled':'disabled'}`"
    />
    <QBtn
      :disable="!localState.enabled"
      icon="filter_b_and_w"
      round
      @click="invert"
    />
    <QRange
      :disable="!localState.enabled"
      v-model="localState.range"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

const localState = reactive<{enabled: boolean, range: {min: number, max: number}, inverted: boolean }>({
  enabled: false,
  inverted: false,
  range: {
    min: 0,
    max: 100,
  },
});
defineExpose();

interface CensorControlEmits {
  (e: 'update', values: typeof localState): void
}
const emit = defineEmits<CensorControlEmits>();

watch(localState, (newState) => {
  emit('update', newState);
});

function invert () {
  console.log('range inverted!');
  localState.inverted = !localState.inverted;
}
</script>
