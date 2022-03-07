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

const router = useRouter();
(async () => {
  await Promise.all([logout(), Timeout.set(1500)]);
  router.replace('login');
})();
</script>
