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
import { useUserStore } from 'src/stores/userStore';
import { useSoupStore } from 'src/stores/soupStore';
import usePeerClient from 'src/composables/usePeerClient';
const persistedStore = usePersistedStore();
const userStore = useUserStore();
const peer = usePeerClient();

const router = useRouter();
(async () => {
  window.sessionStorage.removeItem('loginRedirect');

  const soupStore = useSoupStore();
  if (soupStore.connected) {
    peer.disconnect();
  }

  console.log('resetting persistedStore!');
  persistedStore.$reset();
  console.log('resetting userStore!');
  userStore.$reset();
  await Promise.all([logout(), Timeout.set(600)]);
  router.replace('login');
})();
</script>
