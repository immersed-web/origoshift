<template>
  <div>
    <QToggle
      v-model="enabled"
      :label="`censorshield ${enabled?'enabled':'disabled'}`"
    />
    <QBtn
      :disable="!enabled"
      icon="filter_b_and_w"
      round
      @click="invert"
    />
    <QRange
      :disable="!enabled"
      v-model="localState.range"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';

const enabled = ref<boolean>(false);

const defaultState = {
  // enabled: false,
  inverted: false,
  range: {
    min: 0,
    max: 100,
  },
};
const localState = reactive<typeof defaultState>(defaultState);
defineExpose();

interface CensorControlEmits {
  (e: 'update', values: typeof localState): void
  (e: 'toggle', values: typeof enabled.value): void
}
const emit = defineEmits<CensorControlEmits>();

watch(localState, (newState) => {
  emit('update', newState);
});

watch(enabled, (newValue) => {
  emit('toggle', newValue);
});

onMounted(() => {
  emit('update', localState);
});

function invert () {
  console.log('range inverted!');
  localState.inverted = !localState.inverted;
}
</script>
