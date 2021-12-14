<template>
  <q-page class="row items-center justify-evenly">
    <q-list dense>
      <q-item
        v-for="action in actions"
        :key="action.label"
      >
        <q-btn
          @click="action.fn"
          :label="action.label"
        />
      </q-item>
      <!-- <q-btn
        label="create gaterhing"
        @click="createGathering"
      />
      <q-btn
        label="create room"
        @click="createRoom('testRum')"
      /> -->
    </q-list>
    <h2>Caaannect??? {{ connectionStore.connected }}</h2>
    <p>"{{ token }}"</p>
    <pre>{{ rooms }}</pre>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConnectionStore } from 'src/stores/connection';
import usePeerClient from 'src/composables/usePeerClient';
import { login, getMe, getJwt } from 'src/modules/authClient';
import { createSocket } from 'src/modules/webSocket';

const { setName, createRoom, createGathering, getRooms } = usePeerClient();
const connectionStore = useConnectionStore();
const rooms = ref();
const token = ref<string>('');
interface Action {
  label: string,
  fn: () => unknown,
}

const loginFlow = async () => {
  await login('admin', 'bajskorv');
  // const me = await getMe();
  // console.log('me is: ', me);
  // const maybeJwt = await getJwt();
  // if (maybeJwt) {
  //   token = maybeJwt;
  // }
};

const actions: Action[] = [
  {
    label: 'login',
    fn: loginFlow,
  },
  {
    label: 'getMe',
    fn: () => getMe(),
  },
  {
    label: 'getJwt',
    fn: async () => { token.value = await getJwt(); },
  },
  {
    label: 'create Socket',
    fn: () => createSocket(token.value),
  },
  {
    label: 'setName',
    fn: () => setName('gunnar'),
  },
  {
    label: 'createGathering',
    fn: () => createGathering('coolEvent'),
  },
  {
    label: 'createRoom',
    fn: () => createRoom('coolRoom' + Math.floor(Math.random() * 10)),
  },
  {
    label: 'getRooms',
    fn: async () => {
      rooms.value = await getRooms();
    },
  },

];
</script>
