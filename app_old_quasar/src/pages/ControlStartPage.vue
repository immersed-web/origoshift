<template>
  <div class="fixed-center column q-gutter-xl items-end">
    <QBtn
      color="primary"
      outline
      label="Kamerastation"
      :to="{name:'camera'}"
      icon="linked_camera"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      outline
      label="Rumskontroll"
      :to="{name: 'controlLobby'}"
      icon="room_preferences"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      outline
      :label="manageBtnLabel"
      :to="{ name: 'userManager'}"
      icon="manage_accounts"
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
