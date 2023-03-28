<template>
  <LoggedInHeader />
  <pre>
    {{ senderStore.senderId }}
  </pre>
  <button
    @click="$router.replace({name: 'cameraPickVenue'})"
    class="btn"
  >
    Byt evenemang
  </button>
  <div v-if="!venueStore.currentVenue">
    Waiting for venue {{ senderStore.savedPickedVenueId }} to get loaded...
  </div>
  <template v-else>
    <div
      class="m-6 text-6xl"
    >
      {{ venueStore.currentVenue.name }}
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
        Mediasoup device loaded: {{ soup.deviceLoaded }}
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
      <div
        v-for="(stat, k) in soup.producersStats"
        :key="k"
      >
        {{ k }}
        <pre
          v-for="(entry, key) in stat"
          :key="key"
        >
        {{ key }}: {{ entry }}
      </pre>
      </div>
    </div>
  </template>
</template>

<style>
</style>

<script setup lang="ts">
import LoggedInHeader from '@/components/layout/LoggedInHeader.vue';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { isTRPCClientError } from '@/modules/trpcClient';
import type { ProducerInfo } from 'schemas/mediasoup';
import { useVenueStore } from '@/stores/venueStore';
import { useSenderStore } from '@/stores/senderStore';
import { useSoupStore } from '@/stores/soupStore';
import { useIntervalFn } from '@vueuse/core';

const senderStore = useSenderStore();
const venueStore = useVenueStore();

const router = useRouter();
const soup = useSoupStore();

const { pause } = useIntervalFn(async () => {
  try {
    if(!senderStore.savedPickedVenueId){
      router.replace({name: 'cameraPickVenue'});
      return;
    }
    await venueStore.joinVenue(senderStore.savedPickedVenueId);
    if(!soup.deviceLoaded){
      await soup.loadDevice();
    }
    await soup.createSendTransport();
    pause();
  } catch(e) {
    if(isTRPCClientError(e)){
      console.error(e.message);
    } else if (e instanceof Error){
      console.error(e.message);
    }
  }
}, 5000, {immediateCallback: true} );

onBeforeUnmount(() => {
  venueStore.leaveVenue();
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
  const deviceId = videoDevice.deviceId;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: {
        exact: deviceId,
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

  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  // const restoredProducerId = senderStore.savedProducers.get(deviceId)?.producerId;
  const producerId = await soup.produce({
    // producerId: restoredProducerId,
    track: videoTrack.value,
    producerInfo,
  });
  // senderStore.savedProducers.set(deviceId, {deviceId, producerId, type: 'video'});
}

const permissionState = ref();
onMounted(async () => {
  //@ts-expect-error
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
