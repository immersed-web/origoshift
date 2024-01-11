<template>
  <pre>
    {{ senderStore.senderId }}
  </pre>
  <button
    @click="$router.replace({name: 'senderPickVenue'})"
    class="btn"
  >
    Byt evenemang
  </button>
  <div v-if="!venueStore.currentVenue">
    Waiting for venue {{ venueStore.savedVenueId }} to get loaded...
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
      <div class="form-control w-fit">
        <label class="label cursor-pointer">
          <input
            v-model="senderStore.stereoAudio"
            type="checkbox"
            class="toggle"
          >
          <span class="label-text ">Stereoljud<span
            class="tooltip"
            data-tip="Tänk på att stereo kräver mer bandbredd så använd bara om nödvändigt"
          >
            <span class="material-icons">info</span>
          </span>
          </span>
        </label>
      </div>
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
      <div
        id="video-crop-container"
        class="w-full"
      >
        <pre>{{ cropRange }}</pre>
        <div class="my-6  w-full">
          <!-- NOTE: Be sure to keep the slider at step size 5. Otherwise you might end up with a weird chrome? bug in the worker were "x is not sample aligned in plane 1" -->
          <tc-range-slider
            ref="FOVSlider"
            round="0"
            slider-width="100%"
            slider-height="1rem"
            value1="0"
            value2="100"
            step="5"
            mousewheel-disabled="true"
          />
          <!-- <OButton class="bg-emerald-500">
            TEST
          </OButton>
          <OSlider
            v-model="cropRange[0]"
            size=""
          /> -->
          <!-- <Slider
            v-model="cropRange"
            :lazy="false"
            :step="0.01"
            :min="0.0"
            :max="1.0"
            :tooltips="false"
          /> -->
          <!-- <input
            class="w-full"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model="cropRange[0]"
          >
          <input
            class="w-full"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model="cropRange[1]"
          > -->
        </div>
        <video
          :style="{width: `${(cropRange[1]-cropRange[0])}%`, position:'relative', left: `${cropRange[0]}%`}"
          autoplay
          ref="videoTag"
        />
      </div>
      <div
        class="absolute"
        v-if="soup.videoProducer.stats"
      >
        <pre
          class="relative max-w-full whitespace-pre-wrap"
          v-for="(entry, key) in soup.videoProducer.stats"
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
// import Slider from '@vueform/slider';
import { isTRPCClientError } from '@/modules/trpcClient';
import type { ProducerInfo } from 'schemas/mediasoup';
import { useVenueStore } from '@/stores/venueStore';
import { useSenderStore } from '@/stores/senderStore';
import { useSoupStore } from '@/stores/soupStore';
import { useIntervalFn, useDebounceFn, useWebWorker } from '@vueuse/core';
import VideoFrameWorker from '@/ts/videoFrameWorker?worker';
import type { VideoFrameWorkerMessageData } from '@/ts/videoFrameWorker';
import 'toolcool-range-slider';

const senderStore = useSenderStore();
const venueStore = useVenueStore();

const router = useRouter();
const soup = useSoupStore();

const wrkr = new VideoFrameWorker({name: 'crop that shit!'});
// const { terminate, post } = useWebWorker(new VideoFrameWorker({name: 'crop video'}));

const { pause } = useIntervalFn(async () => {
  try {
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
  wrkr.terminate();
});

const videoTag = ref<HTMLVideoElement>();
const FOVSlider = ref<HTMLElement>();

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

watch(() => senderStore.stereoAudio, () => startAudio(pickedAudioInput.value!));

const audioTrack = shallowRef<MediaStreamTrack>();
async function startAudio(audioDevice: MediaDeviceInfo){
  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: {
        exact: audioDevice.deviceId,
      },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
      sampleRate: 44100,
      sampleSize: 16,
    },
  });
  console.log(audioStream);
  audioTrack.value = audioStream.getAudioTracks()[0];
  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  const producerId = await soup.produce({
    codecOptions: {
      opusStereo: senderStore.stereoAudio?true:undefined,
    },
    // producerId: restoredProducerId,
    track: audioTrack.value,
    producerInfo,
  });

}

const cropRange = reactive([0, 100]);

function setCropRange(evt: CustomEvent) {
  // console.log(evt.detail.values);
  cropRange[0] = (evt.detail.values[0]);
  cropRange[1] = (evt.detail.values[1]);
  const message: VideoFrameWorkerMessageData = {
    crop: {
      xStart: cropRange[0] * 0.01,
      xEnd: cropRange[1] * 0.01,
    },
  };
  wrkr.postMessage(message);

  debouncedFOVUpdate();
}
const sourceVideoTrack = shallowRef<MediaStreamTrack>();
let transformedVideoTrack: MediaStreamVideoTrack;

const videoInfo = computed(() => {
  if(!sourceVideoTrack.value) return undefined;
  const {width, height, frameRate} = sourceVideoTrack.value.getSettings();
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

  const [vTrack] = await stream.getVideoTracks();
  sourceVideoTrack.value = vTrack;
  
  const streamProcessor = new MediaStreamTrackProcessor({track: vTrack});
  const { readable } = streamProcessor;
  
  const videoTrackGenerator = new MediaStreamTrackGenerator({kind: 'video'});
  const { writable } = videoTrackGenerator;
  
  const message: VideoFrameWorkerMessageData = {
    streams: {
      readable,
      writable,
    },
  };
  wrkr.postMessage(message, [readable, writable]);
  
  const transformedStream = new MediaStream([videoTrackGenerator]);
  
  transformedVideoTrack = videoTrackGenerator;
  videoTag.value!.srcObject = transformedStream;

  videoTag.value!.play();

  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  if(soup.videoProducer.producer){
    await soup.replaceVideoProducerTrack(transformedVideoTrack);
  }else{
    await soup.produce({
      // producerId: restoredProducerId,
      track: transformedVideoTrack,
      producerInfo,
    });
    // senderStore.savedProducers.set(deviceId, {deviceId, producerId, type: 'video'});
  }
}

const debouncedFOVUpdate = useDebounceFn(() => {
  if(!senderStore.cameraId){
    console.error('cant update FOV because cameraId isnt set in senderStore');
    return;
  }
  console.log('sending FOV to server');
  senderStore.setFOVForCamera({cameraId:senderStore.cameraId, FOV: {fovStart: cropRange[0]*0.01, fovEnd: cropRange[1]*0.01}});
}, 1000);

const permissionState = ref();
onMounted(async () => {
  //@ts-expect-error
  const perm = await navigator.permissions.query({name: 'camera'});
  permissionState.value = perm.state;
  perm.onchange = _ev => permissionState.value = perm.state;
  mediaDevices.value = await navigator.mediaDevices.enumerateDevices();

  navigator.mediaDevices.addEventListener('devicechange', async () => {
    mediaDevices.value = await navigator.mediaDevices.enumerateDevices();
  });

  FOVSlider.value?.addEventListener('change', (evt) => setCropRange(evt as CustomEvent));
  FOVSlider.value!.step = 5;
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