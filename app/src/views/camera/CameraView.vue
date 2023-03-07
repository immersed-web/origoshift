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
import { soupDevice } from '@/modules/mediasoup';

onMounted(async () =>{
  const routerRtpCapabilities = await clientOrThrow.value.soup.getRouterRTPCapabilities.query();
  console.log(routerRtpCapabilities);
  // soupDevice.load({ routerRtpCapabilities});
});

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

  videoTrack.value = await stream.getVideoTracks()[0];
  videoTag.value!.srcObject = stream;
  videoTag.value!.play();
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
