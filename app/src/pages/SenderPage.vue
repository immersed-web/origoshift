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
        v-if="pickedVideoDevice"
        ref="videoTag"
        autoplay
        style="max-width: 10rem;"
      />
      <QBtn
        color="primary"
        :disable="!mediaStream"
        label="send video"
        @click="produceVideo"
      />
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import LoginBox from 'src/components/LoginBox.vue';
import DevicePicker from 'src/components/DevicePicker.vue';
import { getJwt, login } from 'src/modules/authClient';
import usePeerClient from 'src/composables/usePeerClient';

const peer = usePeerClient();
const soupStore = useSoupStore();

const videoTag = ref<HTMLVideoElement>();

const pickedVideoDevice = ref<MediaDeviceInfo>();
const mediaStream = ref<MediaStream>();
const gatheringName = ref<string>('testEvent');

async function requestMedia (deviceInfo: MediaDeviceInfo) {
  pickedVideoDevice.value = deviceInfo;
  await nextTick();
  if (!videoTag.value) {
    console.log('template ref not available');
    return;
  }
  mediaStream.value = await peer.requestMedia(deviceInfo.deviceId);
  videoTag.value.srcObject = mediaStream.value;
}

async function loginSubmitted ({ username, password }: {username: string, password: string}) {
  await login(username, password);
  const jwt = await getJwt();
  await peer.connect(jwt);
}
async function connectToEvent () {
  const gatheringId = await peer.findGathering(gatheringName.value);
  await peer.joinGatheringAsSender(gatheringId);
}

async function produceVideo () {
  if (!mediaStream.value) return;
  await peer.getRouterCapabilities();
  await peer.loadMediasoupDevice();
  await peer.createSendTransport();
  const producerId = await peer.produce(mediaStream.value);
  console.log('produce returned: ', producerId);
}
</script>

<style lang="scss">
.main-card {
  min-width: 30rem
}
</style>
