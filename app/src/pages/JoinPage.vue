<template>
  <QPage padding>
    <h2 class="text-center">
      Välkommen! Vilket event vill du besöka?
    </h2>
    <div class="row justify-around no-wrap">
      <QCard class="q-ma-md col-6">
        <h3 class="text-center">
          Publika event
        </h3>
        <QList>
          <QItem
            clickable
            v-ripple
            v-for="index in 8"
            :key="index"
          >
            Cool event {{ index }}
          </QItem>
        </QList>
      </QCard>
      <QCard
        id="custom-event-container"
        class="q-ma-md q-pa-lg col-6"
      >
        <h3 class="text-center">
          Join a private event
        </h3>
        <QForm @submit.prevent="joinEvent(eventName)">
          <div class="row q-gutter-md justify-between">
            <QInput
              outlined
              dense
              v-model="eventName"
              class="col-grow"
            />
            <QBtn
              label="join"
              color="primary"
              type="submit"
              icon-right="arrow_right"
            />
          </div>
        </QForm>
      </QCard>
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import usePeerClient from 'src/composables/usePeerClient';
import { guestJwt } from 'src/modules/authClient';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/userStore';
import Timeout from 'await-timeout';

const router = useRouter();
const peer = usePeerClient();
const userStore = useUserStore();
const $q = useQuasar();

$q.loading.show();

const eventName = ref<string>('');

// INFO: here we do the async work (suspense feature is still experimental)
(async () => {
  // await (async () => {
  const fetchJwt = async () => {
    if (userStore.jwt) {
      console.log('already have an access token. will not fetch quest-token');
      return;
    }
    try {
      userStore.jwt = await guestJwt();
    } catch (e) {
      await Timeout.set(5000);
      await fetchJwt();
    }
  };
  await fetchJwt();
  // })();

  // Hide loading spinner
  $q.loading.hide();
})();

const joinEvent = async (eventName: string) => {
  await peer.connect(userStore.jwt);
  console.log('gonna find the event:', eventName);
  const gatheringId = await peer.findGathering(eventName);
  await peer.joinGathering(gatheringId);
  router.push('/client');
};

</script>
