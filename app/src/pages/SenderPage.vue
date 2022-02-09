<template>
  <!-- content -->
  <LoginBox
    class="fixed-center"
    @submit="loginSubmitted"
    v-if="!soupStore.connected"
  />
  <QCard
    v-else
    class="fixed-center main-card"
  >
    <QCardSection
      v-if="!soupStore.gatheringState"
      class="q-gutter-md"
      tag="form"
      @submit.prevent="connectToEvent"
    >
      <QInput
        outlined
        v-model="gatheringName"
        label="event name"
      />
      <QBtn
        type="submit"
        label="connect to event"
      />
    </QCardSection>
    <QCardSection class="q-gutter-lg">
      <DevicePicker
        style="min-width: 15rem;"
        media-type="videoinput"
        @deviceselected="requestMedia"
      />
      <video
        v-show="false"
        ref="videoTag"
        autoplay
        style="max-width: 10rem;"
      />
      <canvas
        style="max-width: 75vw"
        ref="canvasTag"
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
    </QCardSection>
  </QCard>
</template>

<script lang="ts">
import { useUserStore } from 'src/stores/userStore';
// import { getJwt } from 'src/modules/authClient';
import { getJwt, login, getMe } from 'src/modules/authClient';
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
import LoginBox from 'src/components/LoginBox.vue';
import DevicePicker from 'src/components/DevicePicker.vue';
import usePeerClient from 'src/composables/usePeerClient';

const peer = usePeerClient();
const soupStore = useSoupStore();

const videoTag = ref<HTMLVideoElement>();
const canvasTag = ref<HTMLCanvasElement>();

const pickedVideoDevice = ref<MediaDeviceInfo>();
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
  const { width, height } = videoSettings;
  if (!width || !height) throw new Error('couldnt read width and/or heigth from videotrack');
  canvasTag.value.width = width;
  canvasTag.value.height = height;

  const fps = videoSettings.frameRate ? videoSettings.frameRate : 30;
  mediaStream.value = canvasTag.value?.captureStream();
  // mediaStream.value = stream;
}

async function attachVideoToCanvas () {
  const vTag = videoTag.value;
  const cTag = canvasTag.value;
  const ctx = cTag?.getContext('2d', { alpha: false });
  if (!cTag || !vTag || !ctx) {
    throw new Error('canvas or video tag not available');
  }
  const update = () => {
    const xStart = Math.floor(cTag.width * 0.25);
    const xWidth = Math.floor(cTag.width * 0.50);

    // ctx.filter = 'blur(15px)';
    // ctx.drawImage(vTag, 0, 0);
    // const imageData = ctx.getImageData(xStart, 0, xWidth, cTag.height);
    // ctx.filter = 'none';

    ctx.drawImage(vTag, 0, 0);

    ctx.fillRect(xStart, 0, xWidth, cTag.height);
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
}

async function loginSubmitted ({ username, password }: {username: string, password: string}) {
  await login(username, password);
  const me = await getMe();
  console.log('got me: ', me);
  const jwt = await getJwt();
  await peer.connect(jwt);
}
async function connectToEvent () {
  const gatheringId = await peer.findGathering(gatheringName.value);
  await peer.joinGatheringAsSender(gatheringId);
}

async function startProducing () {
  if (!mediaStream.value) return;
  await peer.getRouterCapabilities();
  await peer.loadMediasoupDevice();
  await peer.createSendTransport();
  const producerId = await peer.produce(mediaStream.value);
  console.log('produce returned: ', producerId);
}

async function stopProducing () {
  peer.producers.forEach(producer => { producer.close(); });
}
</script>

<style lang="scss">
.main-card {
  min-width: 30rem
}
</style>
