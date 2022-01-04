<template>
  <q-page class="row">
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
    <q-list dense>
      <q-item
        v-for="room in roomStore.roomsInGathering"
        :key="room.roomId"
      >
        <q-btn
          :label="room.roomId"
          @click="joinRoom(room.roomId)"
        />
        <p>Clients: {{ Object.keys(room.clients).length }}</p>
      </q-item>
    </q-list>
    <h2>Caaannect??? {{ connectionStore.connected }}</h2>

    <video ref="localVideoTag" />
    <pre>{{ roomStore }}</pre>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConnectionStore } from 'src/stores/connectionStore';
import { useRoomStore } from 'src/stores/roomStore';
import usePeerClient from 'src/composables/usePeerClient';
import { login, getMe, getJwt } from 'src/modules/authClient';
import { createSocket } from 'src/modules/webSocket';
// import { RoomState } from 'shared-types/CustomTypes';

const { setName, createRoom, createGathering, joinGathering, joinRoom, requestMedia } = usePeerClient();
const connectionStore = useConnectionStore();
const roomStore = useRoomStore();
// const rooms = ref<RoomState[]>();
const token = ref<string>('');
const gatheringId = ref<string>('');
const localStream = ref<MediaStream>();
const localVideoTag = ref<HTMLVideoElement>();
interface Action {
  label: string,
  fn: () => unknown,
}

const actions: Action[] = [
  {
    label: 'get mediadevice',
    fn: async () => {
      localStream.value = await requestMedia();

      if (localVideoTag.value) {
        localVideoTag.value.srcObject = localStream.value;
        localVideoTag.value.play();
      }
    },
  },
  {
    label: 'login',
    fn: () => login('admin', 'bajskorv'),
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
    fn: async () => {
      gatheringId.value = await createGathering('coolEvent');
    },
  },
  {
    label: 'joinGathering',
    fn: () => joinGathering(gatheringId.value),
  },
  {
    label: 'createRoom',
    fn: () => createRoom('coolRoom' + Math.floor(Math.random() * 100)),
  },
  // {
  //   label: 'getRooms',
  //   fn: async () => {
  //     rooms.value = await getRoomsInGathering();
  //   },
  // },

];
</script>
