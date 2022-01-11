<template>
  <q-page>
    <p>
      Connected: {{ connectionStore.connected }} <q-toggle
        :label="'uiMode ' + uiMode"
        v-model="uiMode"
        true-value="admin"
        false-value="client"
      />
    </p>
    <div class="row">
      <q-list
        dense
      >
        <q-item
          v-for="adminOption in (uiMode === 'admin'? adminUI : clientUI)"
          :key="adminOption.label"
        >
          <q-btn
            v-if="'fn' in adminOption"
            :label="adminOption.label"
            @click="adminOption.fn"
          />
          <div
            class="row"
            v-else-if="'data' in adminOption"
          >
            <p><strong>{{ adminOption.label }}: &nbsp; </strong> </p> <p>{{ adminOption.data.value }}</p>
          </div>
          <q-input
            v-else-if="'input' in adminOption"
            :label="adminOption.label"
            v-model="gatheringId"
          />
          <template
            v-else-if="'options' in adminOption"
          >
            <!-- <pre
              v-for="(mediaInfo, index) in adminOption.options"
              :key="index"
            >{{ mediaInfo }}</pre> -->
            <q-select
              :option-value="'deviceId'"
              :label="adminOption.label"
              v-model="selectedVideoInput"
              :options="adminOption.options.value"
            />
          </template>
        </q-item>
        <!-- <q-item
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
        </q-item> -->
        <!-- <q-btn
        label="create gaterhing"
        @click="createGathering"
      />
      <q-btn
        label="create room"
        @click="createRoom('testRum')"
      /> -->
      </q-list>
      <q-list
        v-if="uiMode === 'client'"
        dense
      >
        <q-item-label>
          Room list:
        </q-item-label>
        <q-item
          v-for="room in roomStore.gatheringState?.rooms"
          :key="room.roomId"
        >
          <q-icon
            v-if="roomStore.currentRoomId === room.roomId "
            name="keyboard_arrow_right"
            size="xl"
          />
          <q-btn
            :label="room.roomId"
            @click="joinRoom(room.roomId)"
          />
          <p>Clients: {{ Object.keys(room.clients).length }}</p>
          <!-- <template v-if="roomStore.currentRoomId === room.roomId"> -->
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
          <!-- </template> -->
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
    </div>
    <div class="row q-mt-xl">
      <video
        style="background:darkblue"
        ref="localVideoTag"
      />
    </div>

    <!-- <pre>{{ roomStore }}</pre> -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, Ref } from 'vue';
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

const mediaDevices = ref<MediaDeviceInfo[]>([]);
const selectedVideoInput = ref<MediaDeviceInfo>();

(async () => {
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  console.log(mediaDevices.value);
})();

const uiMode = ref<'admin' | 'client'>('admin');

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
  fn?: () => unknown,
}

interface DataField {
  label: string,
  data: Ref<unknown>
}

interface DataInput {
  label: string,
  input: Ref<unknown>
}

interface DataSelect {
  label: string,
  options: Ref<unknown[]>,
}

const getJwtAction: Action = {
  label: 'getJwt',
  fn: async () => { token.value = await getJwt(); },
};

const createSocketAction: Action = {
  label: 'create Socket',
  fn: () => createSocket(token.value),
};

const getMeAction: Action = {
  label: 'get me',
  fn: async () => {
    const me = await getMe();
    alert(JSON.stringify(me, null, 2));
  },
};

const adminUI: (Action | DataField | DataInput | DataSelect) [] = [
  {
    label: 'login ADMIN',
    fn: () => login('admin', 'bajskorv'),
  },
  getJwtAction,
  getMeAction,
  createSocketAction,
  {
    label: 'createGathering',
    fn: async () => {
      gatheringId.value = await createGathering('coolEvent');
    },
  },
  {
    label: 'gatheringId',
    input: gatheringId,
  },
  {
    label: 'joingathering, sendTransport & loadDev',
    fn: async () => {
      // gatheringId.value = await createGathering('coolEvent');
      await joinGathering(gatheringId.value);
      await loadMediasoupDevice();
      await createSendTransport();
    },
  },
  {
    label: 'videoDevices',
    options: mediaDevices,
  },
  {
    label: 'selectedVideoDevice',
    data: selectedVideoInput,
  },
  {
    label: 'getMediaInput',
    fn: async () => {
      localStream.value = await requestMedia(selectedVideoInput.value?.deviceId);
      if (localVideoTag.value) {
        localVideoTag.value.srcObject = localStream.value;
        localVideoTag.value.play();
      }
    },
  },
  // create room, join room, add producer to it
  {
    label: 'create room, join it & send video',
    fn: async () => {
      if (!localStream.value) {
        throw Error('no stream!!! Get video input first!!');
      }
      const createdRoomId = await createRoom('coolRoom' + Math.floor(Math.random() * 100));
      await joinRoom(createdRoomId);
      produce(localStream.value);
    },
  },

];

const clientUI: (Action | DataField | DataInput)[] = [
  {
    label: 'login CLIENT',
    fn: () => login('testuser', 'bajskorv'),
  },
  getJwtAction,
  getMeAction,
  createSocketAction,
  // join gathering
  {
    label: 'gatheringId',
    input: gatheringId,
  },
  {
    label: 'joinGathering, create transport, and load dev',
    fn: async () => {
      await joinGathering(gatheringId.value);
      await loadMediasoupDevice();
      await sendRtpCapabilities();
      await createReceiveTransport();
    },
  },
];
</script>
