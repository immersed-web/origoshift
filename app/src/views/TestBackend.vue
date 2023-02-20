<template>
  <div class="m-6">
    <div class="flex">
      <ServerTesting class="flex-none" />
      <div class="flex-1">
        <div class="grid grid-cols-3 gap-4 p-6 m-6">
          <div>
            <p>🫁 {{ clientStore.health }}</p>
            <p>👋 {{ clientStore.greeting }}</p>
            <p>🫀 {{ clientStore.heartbeat }}</p>
            <!-- <p>venueId: {{ venueId }}</p>
            <p>connection: {{ connectionId }}</p> -->
            <p>slider: {{ slider }}</p>
            <XSlider
              :min="1"
              :max="200"
              label="Slide me"
              :model-value="slider"
              @update:modelValue="onSlide"
            />
          </div>
        </div>
        <pre>
          {{ clientStore.positionData }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { client } from '@/modules/trpcClient';
// import type { ConnectionId } from 'schemas';
import { useClientStore } from '@/stores/clientStore';
import ServerTesting from '@/components/ServerTesting.vue';

// Stores
const clientStore = useClientStore();

const slider = ref<number>(0);

function onSlide(evt: number) {
  slider.value = evt;
  client.value.vr.transforms.updateTransform.mutate({
    position: [slider.value, 0, 0],
    orientation: [0,0,0,0],
  });
}

</script>
