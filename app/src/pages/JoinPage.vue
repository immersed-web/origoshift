<template>
  <div
    id="main-container"
    class="row justify-around no-wrap items-center content-center"
  >
    <!-- <QCard class="q-ma-md col-6">
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
      </QCard> -->
    <QCard
      id="custom-event-container"
      class="q-ma-md q-pa-lg"
    >
      <QCardSection>
        <div class="text-h3 text-center">
          Vilket event vill du besöka?
        </div>
      </QCardSection>
      <QCardSection
        tag="form"
        @submit.prevent="joinEvent(eventName)"
      >
        <div class="row q-gutter-md justify-between">
          <QInput
            outlined
            dense
            v-model="eventName"
            class="col-grow"
          />
          <QBtn
            label="Join"
            color="primary"
            type="submit"
            no-caps
            rounded
            icon-right="forward"
          />
        </div>
      </QCardSection>
    </QCard>
  </div>
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

const eventName = ref<string>('testEvent');

// INFO: here we do the async work (suspense feature is still experimental)
(async () => {
  const fetchJwt = async () => {
    if (userStore.jwt) {
      console.log('already have an access token. will not fetch guest-token');
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

  // Hide loading spinner
  $q.loading.hide();
})();

const joinEvent = async (eventName: string) => {
  try {
    await peer.connect(userStore.jwt);
    console.log('gonna find the event:', eventName);
    const gatheringId = await peer.findGathering(eventName);
    await peer.joinGathering(gatheringId);
    await peer.getRouterCapabilities();
    await peer.loadMediasoupDevice();
    router.push('/roomlist');
  } catch (e) {
    console.error(e);
    $q.notify({
      type: 'negative',
      message: 'Very not good! Failed to join the event!!',
    });
    // router.replace('/logout');
  }
};

</script>
<style lang="scss">
#main-container {
  width: 100vw;
  height: 100vh;
}
</style>
