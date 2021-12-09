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
  </q-page>
</template>

<script setup lang="ts">
import { useConnectionStore } from 'src/stores/connection';
import usePeerClient from 'src/composables/usePeerClient';

const { setName, createRoom, createGathering } = usePeerClient();
const connectionStore = useConnectionStore();

const actions = [
  {
    label: 'setName',
    fn: setName,
  },
  {
    label: 'createGathering',
    fn: createGathering,
  },
  {
    label: 'createRoom',
    fn: createRoom,
  },

];
</script>
