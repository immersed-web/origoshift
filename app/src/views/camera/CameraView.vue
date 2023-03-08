<template>
  <LoggedInHeader />
  <div
    class="m-6 text-6xl"
  >
    Kamera-vy!
  </div>
  <button
    v-if="permissionState !== 'granted'"
    @click="requestPermission"
    class="btn"
  >
    Request camera access
  </button>
  <div v-else>
    <pre>
        Permission state: {{ permissionState }}
        Video info: {{ videoInfo }}
        Mediasoup device loaded: {{ deviceLoaded }}
  </pre>
    <select
      v-model="pickedVideoInput"
      class="select select-primary"
    >
      <option
        v-for="(device, key) in videoDevices"
        :key="key"
        :value="device"
      >
        {{ device.label }}
      </option>
    </select>
    <select
      v-model="pickedAudioInput"
      class="select select-primary"
    >
      <option
        v-for="(device, key) in audioDevices"
        :key="key"
        :value="device"
      >
        {{ device.label }}
      </option>
    </select>
    <video
      autoplay
      ref="videoTag"
    />
  </div>
</template>

<style>
</style>

<script setup lang="ts">
import LoggedInHeader from '@/components/layout/LoggedInHeader.vue';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { clientOrThrow } from '@/modules/trpcClient';
import { soupDevice, attachTransportEvents } from '@/modules/mediasoup';
import type {types as soupTypes } from 'mediasoup-client';
import type { ProducerId, ProducerInfo } from 'schemas/mediasoup';

const sendTransport = shallowRef<soupTypes.Transport>();

onMounted(async () =>{
  clientOrThrow.value.soup.subSoupObjectClosed.subscribe(undefined, {
    onData(data) {
      console.log(data);
    },
  });
  const routerRtpCapabilities = await clientOrThrow.value.soup.getRouterRTPCapabilities.query();
  console.log(routerRtpCapabilities);
  await soupDevice.load({ routerRtpCapabilities});
  deviceLoaded.value = soupDevice.loaded;
  clientOrThrow.value.soup.setRTPCapabilities.mutate({
    rtpCapabilities: soupDevice.rtpCapabilities,
  });
  const transportOptions = await clientOrThrow.value.soup.createSendTransport.mutate();
  sendTransport.value = soupDevice.createSendTransport(transportOptions);
  attachTransportEvents(sendTransport.value, async (connectData) => {
    await clientOrThrow.value.soup.connectTransport.mutate(connectData);
  },
  async (produceData) => {
    const producerId = await clientOrThrow.value.soup.createProducer.mutate(produceData);
    return producerId as ProducerId;
  });
});

const deviceLoaded = ref<boolean>(false);

const videoTag = ref<HTMLVideoElement>();

const mediaDevices = ref<MediaDeviceInfo[]>();
const videoDevices = computed(() => {
  return mediaDevices.value?.filter(dev => dev.kind === 'videoinput');
});
const audioDevices = computed(() => {
  return mediaDevices.value?.filter(dev => dev.kind === 'audioinput');
});

const pickedAudioInput = shallowRef<MediaDeviceInfo>();
watch(pickedAudioInput, (pickedDevice) => startAudio(pickedDevice!));

const pickedVideoInput = shallowRef<MediaDeviceInfo>();
watch(pickedVideoInput, (pickedDevice) => startVideo(pickedDevice!));

const audioTrack = shallowRef<MediaStreamTrack>();
async function startAudio(audioDevice: MediaDeviceInfo){
  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: {
        exact: audioDevice.deviceId,
      },
    },
  });
  console.log(audioStream);
  audioTrack.value = audioStream.getAudioTracks()[0];

}
const videoTrack = shallowRef<MediaStreamTrack>();
const videoInfo = computed(() => {
  if(!videoTrack.value) return undefined;
  const {width, height, frameRate} = videoTrack.value.getSettings();
  return {
    width, height, frameRate,
  };
});
async function startVideo(videoDevice: MediaDeviceInfo){
  console.log('starting video!!');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: {
        exact: videoDevice.deviceId,
      },
      width: {
        ideal: 4000,
      },
      height: {
        ideal: 2200,
      },
    },
  });
  console.log(stream);
  const producerInfo: ProducerInfo = {
    isPaused: false,
  };

  videoTrack.value = await stream.getVideoTracks()[0];
  videoTag.value!.srcObject = stream;
  videoTag.value!.play();
  sendTransport.value?.produce({
    track: videoTrack.value,
    appData: {
      producerInfo,
    },
  });
}

const permissionState = ref();
onMounted(async () => {
  const perm = await navigator.permissions.query({name: 'camera'});
  permissionState.value = perm.state;
  perm.onchange = ev => permissionState.value = perm.state;
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();

  navigator.mediaDevices.addEventListener('devicechange', async () => {
    mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  });
});

async function requestPermission() {
  const result = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  result.getTracks().forEach(trk => trk.stop());
}

</script>
