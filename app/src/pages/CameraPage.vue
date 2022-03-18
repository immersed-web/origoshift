<template>
  <div
    class="row q-ma-md"
  >
    <QCard
      class="col-4 q-mr-md"
    >
      <!-- <QCardSection
        v-if="!soupStore.gatheringState"
        class="q-gutter-md"
        tag="form"
        @submit.prevent="connectToEvent()"
      >
        <QInput
          outlined
          v-model="gatheringName"
          label="event name"
        />
        <QBtn
          color="primary"
          type="submit"
          label="connect to event"
        />
        <QBtn
          label="create event"
          @click="createAndJoinEvent"
        />
      </QCardSection> -->
      <QCardSection class="q-gutter-md">
        <QBtn
          label="send custom prop 'handWave' to client"
          @click="peer.setCustomProperties({handWave: true})"
        />
      </QCardSection>
      <QCardSection>
        <QBtn
          label="share screen"
          @click="shareScreen"
        />
      </QCardSection>
      <QCardSection>
        <QBtn
          color="primary"
          :disable="!outputCameraStream"
          label="send video"
          @click="startProducing"
        />
        <!-- <QBtn
          color="secondary"
          label="consume myself"
          @click="consumeMyself"
        /> -->
      </QCardSection>
      <QCardSection>
        <QList>
          <QItem
            v-for="(client, clientKey) in soupStore.roomState?.clients"
            :key="clientKey"
          >
            <QItemSection>
              {{ client.clientId }}: {{ client.username }}
            </QItemSection>
            <QList>
              <QItem
                v-for="(prop, propKey) in client.customProperties"
                :key="propKey"
              >
                <QItemSection>
                  {{ propKey }}: {{ prop }}
                </QItemSection>
              </QItem>
            </QList>
          </QItem>
        </QList>
        {{ soupStore.roomState }}
      </QCardSection>
    </QCard>
    <QCard class="col">
      <QCardSection class="q-gutter-lg">
        <DevicePicker
          style="min-width: 15rem;"
          media-type="videoinput"
          @deviceselected="requestMedia"
        />
        <div
          class="relative-position"
          style="width: fit-content;"
        >
          <CensorControl @update="updateCensorShield" />
          <video
            v-show="false"
            ref="videoTag"
            autoplay
            style="max-width: 10rem;"
          />
          <canvas
            style="max-width: 100%;"
            ref="canvasTag"
          />
          <div id="video-info">
            <pre>{{ videoInfo }}</pre>
          </div>
        </div>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup lang="ts">
import CensorControl from 'src/components/CensorControl.vue';
import { ref, nextTick } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import DevicePicker from 'src/components/DevicePicker.vue';
import usePeerClient from 'src/composables/usePeerClient';
import { useUserStore } from 'src/stores/userStore';
import { usePersistedStore } from 'src/stores/persistedStore';
import { QDialogOptions, useQuasar } from 'quasar';
import { getAllGatherings, getGathering } from 'src/modules/authClient';

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
const outputCameraStream = ref<MediaStream>();
// const gatheringName = ref<string>('testEvent');

const userStore = useUserStore();
const persistedStore = usePersistedStore();
(async () => {
  if (!userStore.userData) {
    throw new Error('no userstate! needed to run camerapage');
  }
  let { gathering } = userStore.userData;
  if (!gathering) {
    if (!persistedStore.gatheringName) {
      persistedStore.gatheringName = await pickGathering();
    }
    gathering = persistedStore.gatheringName;
  }

  await peer.connect(userStore.jwt);
  if (!persistedStore.roomName) {
    persistedStore.roomName = await pickRoom(gathering);
  }
  await enterGatheringAndRoom(gathering, persistedStore.roomName);
  // attachVideoToCanvas();
})();

async function asyncDialog (options: QDialogOptions): Promise<unknown> {
  const dialogPromise = new Promise((resolve, reject) => {
    $q.dialog(options).onOk((payload) => {
      resolve(payload);
    }).onCancel(() => {
      reject();
    }).onDismiss(() => {
      reject();
    });
  });
  return dialogPromise;
}

async function pickGathering (): Promise<string> {
  console.log('no gathering defined. Must pick one!');
  const gatherings = await getAllGatherings();
  if (!gatherings) {
    throw new Error('no gatherings found/fetched!');
  }
  const radioOptions = gatherings.map(gathering => {
    return { label: gathering.name, value: gathering.name };
  });
  const dialogPromise = asyncDialog({
    options: {
      model: '',
      items: radioOptions,
    },
  });
  return dialogPromise as Promise<string>;
}

async function pickRoom (gatheringName: string): Promise<string> {
  console.log('no room defined. Must pick one!');
  const gatheringResponse = await getGathering({ gathering: gatheringName });
  if (!gatheringResponse.rooms) {
    throw new Error('no rooms in api response!');
  }
  const radioOptions = gatheringResponse.rooms.map(room => {
    return { label: room.name, value: room.name };
  });
  // console.log(gatheringResponse);
  const dialogPromise = asyncDialog({
    title: 'Välj Rum',
    options: {
      model: '',
      items: radioOptions,
    },
  });
  return dialogPromise as Promise<string>;
}

let videoStream: MediaStream;
async function requestMedia (deviceInfo: MediaDeviceInfo) {
  pickedVideoDevice.value = deviceInfo;
  await nextTick();
  if (!videoTag.value) {
    console.log('template ref not available');
    return;
  }
  videoStream = await peer.requestMedia(deviceInfo.deviceId);
  const videoSettings = videoStream.getVideoTracks()[0].getSettings();
  if (!videoSettings) throw new Error('couldnt get settings from videotrack!!!');
  const { width, height, frameRate, aspectRatio } = videoSettings;
  videoInfo.value = { width, height, frameRate, aspectRatio };

  videoTag.value.srcObject = videoStream;
}

function setCanvasPropsFromVideoInfo () {
  if (!canvasTag.value) throw new Error('no canvas tag available');
  if (!videoInfo.value) throw new Error('videoInfo is undefined!');
  const { width, height } = videoInfo.value;
  if (!width || !height) throw new Error('couldnt get width and/or height from videotrack');
  canvasTag.value.width = width;
  canvasTag.value.height = height;

  // const fps = videoSettings.frameRate ? videoSettings.frameRate : 30;
  // const canvasStream = canvasTag.value?.captureStream();
  // // const destVideo: HTMLVideoElement = document.querySelector<HTMLVideoElement>('#dest-video');
  // // destVideo.srcObject = canvasStream;
  // mediaStream.value = canvasStream;
}

type CensorUpdateHandler = Exclude<(InstanceType<typeof CensorControl>)['onUpdate'], undefined>;
let censorSettings: Parameters<CensorUpdateHandler>[0];
const updateCensorShield: CensorUpdateHandler = (shieldState) => {
  console.log('censorshield emitted');
  censorSettings = shieldState;

  if (censorSettings.enabled === false) {
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
    if (censorSettings) {
      coverStart = censorSettings.range.min;
      coverWidth = censorSettings.range.max;
      inverted = censorSettings.inverted;
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
let screenStream: MediaStream;
async function shareScreen () {
  const stream = await navigator.mediaDevices.getDisplayMedia();
  screenStream = stream;
  screenStream.getTracks()[0].onended = () => {
    stopProducing();
  };

  producerId = await peer.produce(screenStream, { screenShare: true });
  console.log('produce returned: ', producerId);
  if (!soupStore.clientState) {
    throw new Error('no roomid. cant assign producer to room');
  }
  // peer.assignProducerToRoom(soupStore.clientState?.clientId, producerId, roomId);
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

let producerId: string;
async function startProducing () {
  if (!outputCameraStream.value) return;
  // await peer.getRouterCapabilities();
  // await peer.loadMediasoupDevice();
  // await peer.createSendTransport();
  producerId = await peer.produce(outputCameraStream.value);
  console.log('produce returned: ', producerId);
  if (!soupStore.clientState?.roomId || !soupStore.clientId) {
    throw new Error('no roomid. cant assign producer to room');
  }
  peer.assignProducerToRoom(soupStore.clientId, producerId, soupStore.clientState.roomId);
}

// async function consumeMyself () {
//   if (!producerId) throw new Error('no producerId. cant consume!');
//   await peer.createReceiveTransport();
//   await peer.sendRtpCapabilities();
//   const { consumerId, track } = await peer.consume(producerId);
//   console.log(`consumer created! consumerId: ${consumerId}, track: ${track}`);
//   const destVideo: HTMLVideoElement = document.querySelector<HTMLVideoElement>('#dest-video');
//   const consumeStream = new MediaStream([track]);
//   destVideo.srcObject = consumeStream;
// }

async function stopProducing () {
  peer.producers.forEach(producer => { producer.close(); });
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
