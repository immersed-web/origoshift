
<template>
  <div
    class="tooltip tooltip-bottom text-left"
    :data-tip="props.tooltip"
    :class="{'flex-1': !props.last}"
  >
    <div class="relative">
      <div class="indicator">
        <span
          v-if="props.tooltip"
          class="indicator-item material-icons text-info z-20"
        >
          info
        </span>
        <!-- <span class="indicator-item badge">?</span> -->
        <div class="avatar placeholder z-10">
          <div class="bg-primary text-neutral-content rounded-full w-10">
            <span class="material-icons">
              {{ props.icon }}
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="!props.last"
        class="h-full w-full absolute top-0 flex items-center"
      >
        <div class="bg-primary w-full h-2 z-0" />
      </div>
    </div>
    <div
      v-if="!props.last"
      class="mr-4"
    >
      <div class="flex items-center text-sm">
        <strong>
          <slot name="title" />
        </strong>
      </div>
      <p class="text-sm">
        <slot />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';


const props = defineProps<{
  title?: string,
  icon?: string,
  tooltip?: string,
  last?: boolean
}>();

const tooltip = computed(() => {
  return 'rad_1_\a_rad_2';
});

</script>

<style scoped>

</style>
