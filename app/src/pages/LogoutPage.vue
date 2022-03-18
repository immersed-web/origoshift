<template>
  <QCard class="fixed-center q-pa-lg">
    <QCardSection>
      <div class="text-h5">
        Loggar ut dig!
      </div>
    </QCardSection>
    <QCardSection class="row justify-center">
      <QSpinner
        size="xl"
        class="q-mx-auto"
      />
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { logout } from 'src/modules/authClient';
import { useRouter } from 'vue-router';
import Timeout from 'await-timeout';
import { usePersistedStore } from 'src/stores/persistedStore';
const persistedStore = usePersistedStore();

const router = useRouter();
(async () => {
  window.sessionStorage.removeItem('loginRedirect');
  console.log('resetting persistedStore!');
  // Reset doesnt seem to work!!!
  // persistedStore.$reset();
  persistedStore.$patch({
    gatheringName: undefined,
    roomName: undefined,
  });
  await Promise.all([logout(), Timeout.set(1000)]);
  router.replace('login');
})();
</script>
