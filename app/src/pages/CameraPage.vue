<template>
  <div
    class="row q-ma-md"
  >
    <ClientList
      v-if="soupStore.roomState && soupStore.roomState.clients && soupStore.clientId"
      @client-removed="kickClient"
      class="col-4 q-mr-md"
      :clients="soupStore.roomState?.clients"
      :client-id="soupStore.clientId"
    />
    <QCard class="col">
      <QCardSection
        v-if="!editingRoomName"
        class="row items-center q-gutter-sm"
      >
        <div class="text-h5">
          Rumsnamn: {{ soupStore.roomState?.roomName }}
        </div>
        <QBtn
          round
          color="primary"
          icon="edit"
          @click="editingRoomName = true"
        />
      </QCardSection>
      <QCardSection
        v-else
        tag="form"
        class="row q-gutter-sm"
        @submit.prevent="saveRoomName"
      >
        <QInput
          v-model="inputRoomName"
          outlined
          dense
        />
        <QBtn
          icon="save"
          round
          color="primary"
          type="submit"
        />
        <QBtn
          round
          icon="cancel"
          color="negative"
          @click="editingRoomName = false"
        />
      </QCardSection>
      <QCardSection class="q-gutter-lg">
        <QToggle
          v-model="roomIsOpen"
          :label="roomIsOpen?'rummet är öppet':'rummet är stängd'"
          @click="toggleOpenRoom"
        />
        <DevicePicker
          style="min-width: 15rem;"
          media-type="videoinput"
          @deviceselected="onVideoPicked"
        />
        <DevicePicker
          style="min-width: 15rem;"
          media-type="audioinput"
          @deviceselected="onAudioPicked"
        />
        <div
          class="relative-position"
          style="width: fit-content;"
        >
          <CensorControl
            @update="updateCensorShield"
            @toggle="censorshieldToggled"
          />
          <canvas
            v-show="censorSettings && censorshieldEnabled"
            style="max-width: 100%; background-color: aqua;"
            ref="canvasTag"
          />
          <video
            v-show="censorSettings && !censorshieldEnabled"
            ref="videoTag"
            autoplay
            style="max-width: 100%; background-color: darkcyan;"
          />
        </div>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup lang="ts">
import CensorControl from 'src/components/CensorControl.vue';
import { ref, watch, onUnmounted, onBeforeUnmount } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import DevicePicker from 'src/components/DevicePicker.vue';
import usePeerClient from 'src/composables/usePeerClient';
import { useUserStore } from 'src/stores/userStore';
import { usePersistedStore } from 'src/stores/persistedStore';
import { Dialog, useQuasar } from 'quasar';
import { asyncDialog } from 'src/modules/utilFns';
import { getAllGatherings } from 'src/modules/authClient';
import ClientList from 'src/components/ClientList.vue';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { createResponse } from 'shared-types/MessageTypes';

const $q = useQuasar();
const peer = usePeerClient();
const soupStore = useSoupStore();

const videoTag = ref<HTMLVideoElement>();
const canvasTag = ref<HTMLCanvasElement>();

const pickedVideoDevice = ref<MediaDeviceInfo>();
interface VideoInfo {
  width?: number, height?:number, frameRate?:number, aspectRatio?:number,
}
const videoInfo = ref<VideoInfo>();
// const outputCameraStream = ref<MediaStream>();
// const gatheringName = ref<string>('testEvent');

const userStore = useUserStore();
const persistedStore = usePersistedStore();

const roomIsOpen = ref<boolean>(false);

function toggleOpenRoom () {
  if (!soupStore.roomId) {
    throw Error('no good');
  }
  peer.setCustomRoomProperties(soupStore.roomId, { doorIsOpen: roomIsOpen.value });
}

function kickClient (clientId: string) {
  if (!soupStore.roomId) {
    throw Error('tried to kick client when not in a room');
  }
  peer.removeClientFromRoom(clientId, soupStore.roomId);
}

peer.on('forwardedRequestToJoinRoom', async (msgId, data) => {
  try {
    let username = soupStore.gatheringState?.clients[data.clientId].username;
    if (!username) {
      console.warn('no username found!');
      username = data.clientId;
    }
    const dialogOptions = {
      cancel: true,
      message: `Vill du släppa in ${username}?`,
      title: 'Knock on wood!',
    };
    const _dialogResult = await asyncDialog(dialogOptions, 29000);

    const response = createResponse('forwardedRequestToJoinRoom', msgId, {
      wasSuccess: true,
    });
    await peer.sendResponse(response);
  } catch (e) {
    console.error('not letting in!!!');
    const failResponse = createResponse('forwardedRequestToJoinRoom', msgId, {
      wasSuccess: false,
      message: 'we wont allow your kind around here!!',
    });
    await peer.sendResponse(failResponse);
  }
});

const editingRoomName = ref(false);
const inputRoomName = ref(soupStore.roomState?.roomName);

async function saveRoomName () {
  if (!soupStore.roomId) {
    console.warn('roomId empty! cant save room name');
    return;
  }
  if (inputRoomName.value === undefined) {
    console.warn('roomname was undefined. cant save it');
    return;
  }
  await peer.setRoomName(soupStore.roomId, inputRoomName.value);
  persistedStore.roomName = inputRoomName.value;
  editingRoomName.value = false;
}

onBeforeUnmount(() => {
  peer.leaveRoom();
});

onUnmounted(() => {
  $q.loading.hide();
});

// INITIALIZE;
(async () => {
  try {
    $q.loading.show();
    if (!userStore.userData || !userStore.jwt) {
      throw new Error('no userstate! needed to run camerapage');
    }
    let { gathering } = userStore.userData;
    if (!gathering) {
      if (!persistedStore.gatheringName) {
        console.log('no gathering defined. Must pick one!');
        const gatherings = await getAllGatherings();
        if (!gatherings) {
          throw new Error('no gatherings found/fetched!');
        }
        $q.loading.hide();
        const pickedGatheringName = await pickGathering(gatherings.map(gathering => gathering.name));
        $q.loading.show();
        const pickedGathering = gatherings.find(gathering => gathering.name === pickedGatheringName);
        if (!pickedGathering) throw new Error('pickedGatheringName not found in gathering array. THis should not happen. Bug');
        persistedStore.gatheringName = pickedGatheringName;
      }
      gathering = persistedStore.gatheringName;
    }

    await peer.connect(userStore.jwt);
    if (!persistedStore.roomName) {
      console.log('no room in storage. Must choose roomName manually!');
      $q.loading.hide();
      persistedStore.roomName = await chooseRoomName();
      $q.loading.show();
    }
    await enterGatheringAndRoom(gathering, persistedStore.roomName);
    $q.loading.hide();

    // This is a dirty and filthy hack to force audio and video permissions.
    // In the future we'll be able to use the much nicer permissions API, but thats not rolled out to browsers yet
    const _throwAwayStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'failed to initialize camerapage!');
    $q.notify({
      type: 'negative',
      message: msg,
    });
    // $q.notify('will return to previous page');
    // await Timeout.set(1500);
    // router.back();
  }
})();

async function pickGathering (gatherings: string[]): Promise<string> {
  const radioOptions = gatherings.map(gatheringName => {
    return { label: gatheringName, value: gatheringName };
  });
  const dialogPromise = asyncDialog({
    title: 'Skola',
    message: 'Vilken skola vill du ansluta till?',
    noRouteDismiss: false,
    noBackdropDismiss: true,
    noEscDismiss: true,
    options: {
      model: gatherings[0],
      items: radioOptions,
    },
  });
  return dialogPromise as Promise<string>;
}

async function chooseRoomName (): Promise<string> {
  // console.log(gatheringResponse);
  const dialogPromise = asyncDialog({
    title: 'Rum',
    message: 'Vilket rum vill du gå med i?',
    // persistent: true,
    noBackdropDismiss: true,
    noEscDismiss: true,
    noRouteDismiss: false,
    prompt: {
      outlined: true,
      model: '',
      isValid: val => !!val,
    },
  });
  return dialogPromise as Promise<string>;
}

let videoStream: MediaStream;
async function onVideoPicked (deviceInfo: MediaDeviceInfo) {
  pickedVideoDevice.value = deviceInfo;
  persistedStore.deviceId = deviceInfo.deviceId;
  if (!videoTag.value) {
    console.log('template ref not available');
    return;
  }
  // videoStream = await peer.requestMedia(deviceInfo.deviceId);
  videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceInfo.deviceId,
    },
  });
  const videoSettings = videoStream.getVideoTracks()[0].getSettings();
  if (!videoSettings) throw new Error('couldnt get settings from videotrack!!!');
  const { width, height, frameRate, aspectRatio } = videoSettings;
  videoInfo.value = { width, height, frameRate, aspectRatio };

  videoTag.value.srcObject = videoStream;
  setCanvasPropsFromVideoInfo();

  handleVideoStreamChanged();
}

const audioTrack = ref<MediaStreamTrack>();
let audioStream: MediaStream;
async function onAudioPicked (deviceInfo: MediaDeviceInfo) {
  console.log('audio picked: ', deviceInfo);
  audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceInfo.deviceId,
    },
  });
  const audioTracks = audioStream.getAudioTracks();
  console.log('got usermedia audiotracks:', audioTracks);
  audioTrack.value = audioTracks[0];
}

let audioProducerId: string;
watch(audioTrack, async (newAudioTrack, prevAudioTrack) => {
  console.log('audioTrack watch triggered:', newAudioTrack, prevAudioTrack);
  // Was first track?
  if (!prevAudioTrack && newAudioTrack) {
    audioProducerId = await peer.produce(newAudioTrack);
    if (!soupStore.clientState?.roomId || !soupStore.clientId) {
      throw new Error('no roomid. cant assign producer to room');
    }
    peer.assignMainProducerToRoom(soupStore.clientId, audioProducerId, soupStore.clientState.roomId, 'audio');
  } else if (prevAudioTrack && newAudioTrack) {
    prevAudioTrack.stop();
    if (!audioProducerId) {
      throw new Error('no previous audio producer when expected one');
    }
    peer.replaceProducerTrack(audioProducerId, newAudioTrack);
  }
});

let videoProducerId: string;
let originalVideoTrack: MediaStreamTrack;
async function handleVideoStreamChanged () {
  // Ok. The videoStream was changed. we must update the producer and/or the canvas accordingly

  if (!censorSettings.value) {
    throw new Error('censorSettings is undefined');
  }
  // We already have a producer created.
  if (videoProducerId) {
    originalVideoTrack.stop();
    originalVideoTrack = videoStream.getVideoTracks()[0];
    if (!censorshieldEnabled.value) {
      peer.replaceProducerTrack(videoProducerId, originalVideoTrack.clone());
    }
  } else {
    originalVideoTrack = videoStream.getVideoTracks()[0];
    let clonedTrack = originalVideoTrack.clone();
    if (censorshieldEnabled.value) {
      attachVideoToCanvas();
      setCanvasPropsFromVideoInfo();
      if (!canvasStream) throw new Error('canvasStream undefined! cant use it for producer');
      // stream = canvasStream;
      clonedTrack = canvasStream.getVideoTracks()[0];
    }

    videoProducerId = await peer.produce(clonedTrack);
    console.log('produce returned: ', videoProducerId);
    if (!soupStore.clientState?.roomId || !soupStore.clientId) {
      throw new Error('no roomid. cant assign producer to room');
    }
    peer.assignMainProducerToRoom(soupStore.clientId, videoProducerId, soupStore.clientState.roomId, 'video');
    // startProducing();
  }
}

function setCanvasPropsFromVideoInfo () {
  if (!canvasTag.value) throw new Error('no canvas tag available');
  if (!videoInfo.value) throw new Error('videoInfo is undefined!');
  const { width, height } = videoInfo.value;
  if (!width || !height) throw new Error('couldnt get width and/or height from videotrack');
  canvasTag.value.width = width;
  canvasTag.value.height = height;
}

type CensorUpdateHandler = Exclude<(InstanceType<typeof CensorControl>)['onUpdate'], undefined>;
const censorSettings = ref<Parameters<CensorUpdateHandler>[0]>();
const updateCensorShield: CensorUpdateHandler = (shieldState) => {
  console.log('censorshield emitted');
  censorSettings.value = shieldState;
};

const censorshieldEnabled = ref<boolean>(false);
const censorshieldToggled = (enabled: boolean) => {
  censorshieldEnabled.value = enabled;
  if (censorshieldEnabled.value) {
    attachVideoToCanvas();
    if (videoProducerId && canvasStream) {
      peer.replaceProducerTrack(videoProducerId, canvasStream.getVideoTracks()[0]);
    }
  } else {
    if (videoProducerId) {
      const clonedVideoTrack = originalVideoTrack.clone();
      peer.replaceProducerTrack(videoProducerId, clonedVideoTrack);
    }
    detachVideoFromCanvas();
  }
};

let canvasStream: MediaStream |undefined;
let drawToCanvas = false;
function attachVideoToCanvas () {
  drawToCanvas = true;
  const vTag = videoTag.value;
  const cTag = canvasTag.value;
  const ctx = cTag?.getContext('2d', { alpha: false });
  if (!cTag || !vTag || !ctx) {
    throw new Error('canvas or video tag not available');
  }
  const update = () => {
    let coverStart = 0;
    let coverWidth = 100;
    let inverted = false;
    if (censorSettings.value) {
      coverStart = censorSettings.value.range.min;
      coverWidth = censorSettings.value.range.max;
      inverted = censorSettings.value.inverted;
    }
    const xStart = Math.floor(cTag.width * (coverStart * 0.01));
    const xWidth = Math.floor(cTag.width * ((coverWidth - coverStart) * 0.01));

    // ctx.filter = 'blur(15px)';
    // ctx.drawImage(vTag, 0, 0);
    // const imageData = ctx.getImageData(xStart, 0, xWidth, cTag.height);
    // ctx.filter = 'none';

    ctx.drawImage(vTag, 0, 0);

    if (inverted) {
      ctx.fillRect(0, 0, xStart, cTag.height);
      ctx.fillRect(xStart + xWidth, 0, cTag.width, cTag.height);
    } else {
      ctx.fillRect(xStart, 0, xWidth, cTag.height);
    }
    // ctx.putImageData(imageData, xStart, 0);
    if (drawToCanvas) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);

  // const capturedStream = cTag.captureStream();
  // if(!capturedStream) throw new Error('failed to capture stream from canvas!');
  canvasStream = cTag.captureStream();
}

function detachVideoFromCanvas () {
  drawToCanvas = false;
  canvasStream = undefined;
}

// TODO: How to handle roles without assigned gathering (admin)
async function enterGatheringAndRoom (gatheringName: string, roomName: string) {
  // if (!userStore.userData) throw new Error('no userstate! needed to run camerapage');
  // if (!gatheringName) {
  //   throw new Error('no gathering assigned for user! Cant connect...');
  // }
  soupStore.setGatheringState(await peer.joinOrCreateGathering(gatheringName));
  await peer.getRouterCapabilities();
  await peer.loadMediasoupDevice();
  await peer.createSendTransport();

  const roomState = await peer.joinOrCreateRoom(roomName);
  soupStore.setRoomState(roomState);
}
</script>

<style lang="scss">
.main-card {
  min-width: 30rem
}

#video-info {
  position: absolute;
  padding: 1rem;
  left: 0;
  bottom: 0;
  z-index: 80;
  background-color: rgba(231, 188, 255, 0.2);
}
</style>
