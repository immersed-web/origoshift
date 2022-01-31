<template>
  <q-page padding>
    <h2 class="text-center">
      Välkommen! Vilket event vill du besöka?
    </h2>
    <div class="row justify-around no-wrap">
      <q-card class="q-ma-md col-6">
        <h3 class="text-center">
          Publika event
        </h3>
        <q-list>
          <q-item
            clickable
            v-ripple
            v-for="index in 8"
            :key="index"
          >
            Cool event {{ index }}
          </q-item>
        </q-list>
      </q-card>
      <q-card
        id="custom-event-container"
        class="q-ma-md q-pa-lg col-6"
      >
        <h3 class="text-center">
          Join a private event
        </h3>
        <div class="row q-gutter-md justify-between">
          <q-form @submit.prevent="joinEvent(eventName)">
            <q-input
              outlined
              dense
              v-model="eventName"
              class="col-grow"
            />
            <q-btn
              label="join"
              color="primary"
              type="submit"
              icon-right="arrow_right"
            />
          </q-form>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import usePeerClient from 'src/composables/usePeerClient';
import { guestJwt } from 'src/modules/authClient';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/userStore';

const peer = usePeerClient();
const userStore = useUserStore();
const $q = useQuasar();

$q.loading.show();

const eventName = ref<string>('');

// INFO: here we do the async work (suspense feature is still experimental)
(async () => {
  userStore.jwt = await guestJwt();
  // Hide loading spinner
  $q.loading.hide();
})();

const joinEvent = () => {
  await peer.connect(userStore.jwt);
  await peer.joinGathering();
};

</script>
