<template>
  <!-- <video
    autoplay
    style="max-width: 40rem;"
    id="dest-video"
  /> -->
  <div
    class="row q-ma-md"
  >
    <QCard
      class="col-4 q-mr-md"
    >
      <QCardSection
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
      </QCardSection>
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
          :disable="!mediaStream"
          label="send video"
          @click="startProducing"
        />
        <QBtn
          color="secondary"
          label="consume myself"
          @click="consumeMyself"
        />
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

<script lang="ts">
import { useUserStore } from 'src/stores/userStore';
// import { getJwt } from 'src/modules/authClient';
import CensorControl from 'src/components/CensorControl.vue';
import { getJwt } from 'src/modules/authClient';
export default {
  async preFetch () {
    const userStore = useUserStore();
    const jwt = await getJwt();
    userStore.jwt = jwt;
    console.log('userStore:', userStore.userData);
    console.log('RUNNING PREFETCH');
  },
};
</script>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import DevicePicker from 'src/components/DevicePicker.vue';
import usePeerClient from 'src/composables/usePeerClient';

const peer = usePeerClient();
const soupStore = useSoupStore();

const videoTag = ref<HTMLVideoElement>();
const canvasTag = ref<HTMLCanvasElement>();

const pickedVideoDevice = ref<MediaDeviceInfo>();
const videoInfo = ref<Record<string, string | number | undefined>>();
const mediaStream = ref<MediaStream>();
const gatheringName = ref<string>('testEvent');

const userStore = useUserStore();
(async () => {
  await peer.connect(userStore.jwt);
  attachVideoToCanvas();
})();

async function requestMedia (deviceInfo: MediaDeviceInfo) {
  pickedVideoDevice.value = deviceInfo;
  await nextTick();
  if (!videoTag.value) {
    console.log('template ref not available');
    return;
  }
  const stream = await peer.requestMedia(deviceInfo.deviceId);
  const videoSettings = stream.getVideoTracks()[0].getSettings();
  if (!videoSettings) throw new Error('coludnt get settings from videotrack!!!');
  videoTag.value.srcObject = stream;

  if (!canvasTag.value) throw new Error('no canvas tag available');
  const { width, height, frameRate, aspectRatio } = videoSettings;
  videoInfo.value = { width, height, frameRate, aspectRatio };
  if (!width || !height) throw new Error('couldnt read width and/or heigth from videotrack');
  canvasTag.value.width = width;
  canvasTag.value.height = height;

  const fps = videoSettings.frameRate ? videoSettings.frameRate : 30;
  const canvasStream = canvasTag.value?.captureStream();
  // const destVideo: HTMLVideoElement = document.querySelector<HTMLVideoElement>('#dest-video');
  // destVideo.srcObject = canvasStream;
  mediaStream.value = canvasStream;
}

type CensorUpdateHandler = Exclude<(InstanceType<typeof CensorControl>)['onUpdate'], undefined>;
// type test2 = Exclude<test, undefined>
// type asdkj= Extract<ssd, Record<string, unknown>>
// const censorComponent = ref<InstanceType<typeof CensorControl>>();

// const censorSettings = ref<Parameters<CensorUpdateHandler>[0]>({});
let censorSettings: Parameters<CensorUpdateHandler>[0];
const updateCensorShield: CensorUpdateHandler = (shieldState) => {
  console.log('censorshield emitted');
  censorSettings = shieldState;
};

async function attachVideoToCanvas () {
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
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

async function shareScreen () {
  const stream = await navigator.mediaDevices.getDisplayMedia();
  mediaStream.value = stream;
  mediaStream.value.getTracks()[0].onended = () => {
    stopProducing();
  };

  producerId = await peer.produce(mediaStream.value, { screenShare: true });
  console.log('produce returned: ', producerId);
  if (!soupStore.clientState) {
    throw new Error('no roomid. cant assign producer to room');
  }
  // peer.assignProducerToRoom(soupStore.clientState?.clientId, producerId, roomId);
}

// async function loginSubmitted ({ username, password }: {username: string, password: string}) {
//   await login(username, password);
//   const me = await getMe();
//   console.log('got me: ', me);
//   const jwt = await getJwt();
//   await peer.connect(jwt);
// }
async function connectToEvent (gatheringId?: string) {
  if (!gatheringId) {
    gatheringId = await peer.findGathering(gatheringName.value);
  }
  // await peer.joinGatheringAsSender(gatheringId);
  await peer.joinGathering(gatheringId);
  await peer.getRouterCapabilities();
  await peer.loadMediasoupDevice();
  await peer.createSendTransport();
}

let roomId: string;
async function createAndJoinEvent () {
  const gatheringId = await peer.createGathering(gatheringName.value);
  // console.log('create Gathering response: ', gatheringId);
  await connectToEvent(gatheringId);
  roomId = await peer.createAndJoinRoom('testRoom');
}

let producerId: string;
async function startProducing () {
  if (!mediaStream.value) return;
  // await peer.getRouterCapabilities();
  // await peer.loadMediasoupDevice();
  // await peer.createSendTransport();
  producerId = await peer.produce(mediaStream.value);
  console.log('produce returned: ', producerId);
  if (!soupStore.clientState) {
    throw new Error('no roomid. cant assign producer to room');
  }
  peer.assignProducerToRoom(soupStore.clientState?.clientId, producerId, roomId);
}

async function consumeMyself () {
  if (!producerId) throw new Error('no producerId. cant consume!');
  await peer.createReceiveTransport();
  await peer.sendRtpCapabilities();
  const { consumerId, track } = await peer.consume(producerId);
  console.log(`consumer created! consumerId: ${consumerId}, track: ${track}`);
  const destVideo: HTMLVideoElement = document.querySelector<HTMLVideoElement>('#dest-video');
  const consumeStream = new MediaStream([track]);
  destVideo.srcObject = consumeStream;
}

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
