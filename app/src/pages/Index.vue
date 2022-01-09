<template>
  <q-page>
    <p>Connected: {{ connectionStore.connected }}</p>
    <div class="row">
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
        <q-item>
          <q-input
            label="gatheringId"
            v-model="gatheringId"
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
          v-for="room in roomStore.gatheringState?.rooms"
          :key="room.roomId"
        >
          <q-btn
            :label="room.roomId"
            @click="joinRoom(room.roomId)"
          />
          <p>Clients: {{ Object.keys(room.clients).length }}</p>
          <template v-if="roomStore.currentRoomId === room.roomId">
            <template v-for="client in room.clients">
              <q-item
                v-for="producer in client.producers"
                :key="producer.producerId"
              >
                <q-btn
                  label="consume"
                  @click="receiveStream(producer.producerId)"
                />
              </q-item>
            </template>
          </template>
        </q-item>
        <q-item>
          <q-btn
            label="create receivetransport"
            @click="createReceiveTransport"
          />
        </q-item>
      </q-list>
      <q-list id="video-list">
        <!-- <q-item
          v-for="track in receivedTracks"
          :key="track.id"
        >
          <video
            width="100px"
            autoplay
          />
        </q-item> -->
      </q-list>
      <q-list>
        <video
          style="background:darkblue"
          ref="localVideoTag"
        />
        <q-item
          v-for="action in videoActions"
          :key="action.label"
        >
          <q-btn
            :label="action.label"
            @click="action.fn"
          />
        </q-item>
      </q-list>
    </div>

    <!-- <pre>{{ roomStore }}</pre> -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConnectionStore } from 'src/stores/connectionStore';
import { useRoomStore } from 'src/stores/roomStore';
import usePeerClient from 'src/composables/usePeerClient';
import { login, getMe, getJwt } from 'src/modules/authClient';
import { createSocket } from 'src/modules/webSocket';
// import { RoomState } from 'shared-types/CustomTypes';

const { sendRtpCapabilities, setName, createRoom, createGathering, joinGathering, joinRoom, loadMediasoupDevice, requestMedia, createSendTransport, createReceiveTransport, produce, consume } = usePeerClient();
// const { } = usePeerClient();
const connectionStore = useConnectionStore();
const roomStore = useRoomStore();
// const rooms = ref<RoomState[]>();
const token = ref<string>('');
const gatheringId = ref<string>('');
const localStream = ref<MediaStream>();
const localVideoTag = ref<HTMLVideoElement>();
const receivedTracks = ref<MediaStreamTrack[]>([]);

watch(receivedTracks, (newValue) => {
  console.log('recievedTracks updated:', newValue);
  const videoList = document.getElementById('video-list');
  newValue.forEach((track) => {
    const videoTag = new HTMLVideoElement();
    videoList?.appendChild<HTMLVideoElement>(videoTag);
    const stream = new MediaStream([track]);
    videoTag.srcObject = stream;
  });
});

const receiveStream = async (producerId: string) => {
  const track = await consume(producerId);
  receivedTracks.value.push(track);
  const videoList = document.getElementById('video-list');
  console.log('fetched video-list container element:', videoList);
  const videoTag = document.createElement('video');
  videoTag.autoplay = true;
  console.log('created a videoElement:', videoTag);
  const attachedElement = videoList?.appendChild<HTMLVideoElement>(videoTag);
  console.log('attached element', attachedElement);

  const stream = new MediaStream([track]);
  videoTag.srcObject = stream;
};

interface Action {
  label: string,
  fn: () => unknown,
}

const videoActions: Action[] = [
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
    label: 'create sendTransport',
    fn: async () => {
      await createSendTransport();
    },
  },
  {
    label: 'produce',
    fn: async () => {
      if (!localStream.value) {
        console.error('no stream set');
        return;
      }
      produce(localStream.value);
    },
  },
];

const actions: Action[] = [
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
    label: 'load MEDIASOUPdevice',
    fn: async () => {
      await loadMediasoupDevice();
    },
  },
  {
    label: 'send RTPcaps',
    fn: async () => sendRtpCapabilities(),
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
