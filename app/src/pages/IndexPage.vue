<template>
  <QPage>
    <p>
      Connected: {{ connectionStore.connected }} <QToggle
        :label="'uiMode ' + uiMode"
        v-model="uiMode"
        true-value="admin"
        false-value="client"
      />
    </p>
    <div class="row">
      <QList
        dense
      >
        <QItem
          v-for="adminOption in (uiMode === 'admin'? adminUI : clientUI)"
          :key="adminOption.label"
        >
          <QBtn
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
          <QSelect
            v-else-if="'options' in adminOption"
            style="width: 20rem;"
            :option-value="'deviceId'"
            :label="adminOption.label"
            v-model="adminOption.model.value"
            :options="adminOption.options.value"
          />
          <QInput
            v-else-if="'model' in adminOption"
            :label="adminOption.label"
            v-model="adminOption.model.value"
          />
        </QItem>
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
      </QList>
      <QList
        v-if="uiMode === 'client'"
        dense
      >
        <QItemLabel>
          Room list:
        </QItemLabel>
        <QItem
          v-for="room in roomStore.gatheringState?.rooms"
          :key="room.roomId"
        >
          <QIcon
            v-if="roomStore.currentRoomId === room.roomId "
            name="keyboard_arrow_right"
            size="xl"
          />
          <QBtn
            :label="room.roomId"
            @click="joinRoomAndStartConsuming(room.roomId)"
          />
          <!-- <p>Clients: {{ Object.keys(room.clients).length }}</p>
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
          </template> -->
        </QItem>
      </QList>
      <QList id="video-list">
        <QItem
          v-for="stream in receivedStreams"
          :key="stream.id"
        >
          <video
            width="100px"
            autoplay
          />
        </QItem>
      </QList>
    </div>
    <div class="row q-mt-xl">
      <video
        style="background:darkblue"
        ref="localVideoTag"
      />
    </div>

    <!-- <pre>{{ roomStore }}</pre> -->
  </QPage>
</template>

<script setup lang="ts">
import { ref, watch, Ref, computed, nextTick } from 'vue';
import { useConnectionStore } from 'src/stores/connectionStore';
import { useRoomStore } from 'src/stores/roomStore';
import usePeerClient from 'src/composables/usePeerClient';
import { login, getMe, getJwt } from 'src/modules/authClient';
import { createSocket } from 'src/modules/webSocket';
// import { RoomState } from 'shared-types/CustomTypes';

const { sendRtpCapabilities, createRoom, createGathering, joinGathering, joinRoom, loadMediasoupDevice, requestMedia, createSendTransport, createReceiveTransport, produce, consume, onConsumerClosed } = usePeerClient();
// const { } = usePeerClient();
const connectionStore = useConnectionStore();
const roomStore = useRoomStore();
// const rooms = ref<RoomState[]>();
const token = ref<string>('');
const gatheringId = ref<string>('');
const localStream = ref<MediaStream>();
const localVideoTag = ref<HTMLVideoElement>();
const receivedTracks = ref<MediaStreamTrack[]>([]);
const receivedStreams = computed(() => {
  const receivedStreams: MediaStream[] = [];
  receivedTracks.value.forEach(track => {
    receivedStreams.push(new MediaStream([track]));
  });
  return receivedStreams;
});

const mediaDevices = ref<MediaDeviceInfo[]>([]);

const videoMediaDevices = computed(() => {
  return mediaDevices.value.filter((dev) => {
    return dev.kind === 'videoinput';
  }).map((dev) => {
    return {
      deviceId: dev.deviceId,
      label: dev.label,
      kind: dev.kind,
    };
  });
});
const selectedVideoInput = ref<MediaDeviceInfo>();

const listDevices = async () => {
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  console.log('mediaDevices: ', mediaDevices.value);
};

listDevices();

const uiMode = ref<'admin' | 'client'>('client');

watch(receivedTracks, async (newValue) => {
  await nextTick();
  console.log('recievedTracks updated:', newValue);
  const videoList = document.getElementById('video-list');
  if (!videoList) return;
  newValue.forEach((track) => {
    const children = videoList.children;
    for (const child of children) {
      const video : HTMLVideoElement = child.firstElementChild as HTMLVideoElement;
      video.srcObject = new MediaStream([track]);
    }
  });
  //   videoList?.appendChild<HTMLVideoElement>(videoTag);
  //   const stream = new MediaStream([track]);
  //   videoTag.srcObject = stream;
  // });
}, { deep: true });
onConsumerClosed((consumerId) => {
  const videoTag = document.getElementById(consumerId);
  videoTag?.remove();
});

const joinRoomAndStartConsuming = async (roomId: string) => {
  await joinRoom(roomId);
  const room = roomStore.gatheringState?.rooms[roomId];
  if (!room) {
    throw Error('room not found in gatheringState');
  }
  for (const client of Object.values(room.clients)) {
    for (const producer of Object.values(client.producers)) {
      receiveStream(producer.producerId);
    }
  }
};

const receiveStream = async (producerId: string) => {
  await createReceiveTransport();
  const { track } = await consume(producerId);
  receivedTracks.value.push(track);
  // const videoList = document.getElementById('video-list');
  // console.log('fetched video-list container element:', videoList);
  // const videoTag = document.createElement('video');
  // videoTag.id = consumerId;
  // videoTag.autoplay = true;
  // console.log('created a videoElement:', videoTag);
  // const attachedElement = videoList?.appendChild<HTMLVideoElement>(videoTag);
  // console.log('attached element', attachedElement);

  // const stream = new MediaStream([track]);
  // videoTag.srcObject = stream;
  // setTimeout(() => {
  //   videoTag.play();
  // }, 1000);
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
  model: Ref<string | number | null | undefined>
}

interface DataSelect {
  label: string,
  options: Ref<unknown[]>,
  model: Ref<unknown>
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
    model: gatheringId,
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
    label: 'enumerate devs',
    fn: async () => {
      await listDevices();
    },
  },
  {
    label: 'videoDevices',
    options: videoMediaDevices,
    model: selectedVideoInput,
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
  {
    label: 'request default video',
    fn: async () => {
      localStream.value = await requestMedia();
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
    model: gatheringId,
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
