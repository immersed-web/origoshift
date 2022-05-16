<template>
  <div class="fixed-center column q-gutter-xl items-end">
    <QBtn
      color="primary"
      label="Kamerastation"
      :to="{name:'camera'}"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      label="Rumskontroll"
      :to="{name: 'controlRoom'}"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      :label="manageBtnLabel"
      :to="{ name: 'userManager'}"
      icon-right="navigate_next"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from 'src/stores/userStore';

const userStore = useUserStore();

const manageBtnLabel = computed(() => {
  const isAdmin = userStore.userData?.role === 'admin';
  if (isAdmin) { return 'Hantera konton'; }
  return 'Hantera elevkonton';
});

</script>
