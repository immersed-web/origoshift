<template>
  <QSelect
    dense
    outlined
    v-model="selectedDevice"
    :options="filteredDevices"
    :option-value="'deviceId'"
  />
  <!-- <QIcon name="home" /> -->
</template>

<script setup lang="ts">

import { ref, computed, watch } from 'vue';

const props = defineProps<{mediaType?: MediaDeviceInfo['kind']}>();
type DevicePickerEmits = {
  (e: 'deviceselected', device: MediaDeviceInfo) : void
}
const emit = defineEmits<DevicePickerEmits>();
const mediaDevices = ref<MediaDeviceInfo[]>([]);
const filteredDevices = computed(() => {
  if (!mediaDevices.value) return [];
  const filteredDevs = mediaDevices.value?.filter(device => {
    if (!props.mediaType) return true;
    return device.kind === props.mediaType;
  });
  console.log('filtered mediaDevices:', filteredDevs);
  return filteredDevs;
});
const selectedDevice = ref<MediaDeviceInfo>();
watch(selectedDevice, (device) => {
  if (!device) return;
  emit('deviceselected', device);
});

(async () => {
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  console.log('mediaDevices: ', mediaDevices.value);
})();
</script>
