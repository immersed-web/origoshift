<template>
  <!-- <pre>
    {{ senderStore.senderId }}
  </pre> -->
  <div class="flex gap-3 items-center">
    <div
      class="my-6 text-2xl"
    >
      <span class="">Sänder till: </span><span class="font-bold">{{ venueStore.currentVenue?.name }}</span>
    </div>
    <button
      @click="$router.replace({name: 'senderPickVenue'})"
      class="btn btn-sm btn-primary"
    >
      Byt evenemang
    </button>
  </div>
  <div v-if="!venueStore.currentVenue">
    Väntar på att evenemanget ska laddas...
  </div>
  <template v-else>
    <button
      v-if="permissionState !== 'granted'"
      @click="requestPermission"
      class="btn"
    >
      Request camera access
    </button>
    <div v-else>
      <!-- <pre>
        Permission state: {{ permissionState }}
        Video info: {{ videoInfo }}
        Mediasoup device loaded: {{ soup.deviceLoaded }}
      </pre> -->
      <div class="form-control w-fit mb-6">
        <label class="label cursor-pointer">
          <input
            v-model="senderStore.stereoAudio"
            type="checkbox"
            class="toggle toggle-primary"
          >
          <span class="label-text flex items-center ml-2">Stereoljud<span
            class="tooltip cursor-help flex items-center"
            data-tip="Tänk på att stereo kräver mer bandbredd så använd bara om nödvändigt"
          >
            <span class="material-icons">info</span>
          </span>
          </span>
        </label>
      </div>
      <div class="flex gap-6">
        <div>
          <label>
            Videokälla:
          </label>
          <select
            v-model="pickedVideoInput"
            class="select select-bordered"
          >
            <option
              v-for="(device, key) in videoDevices"
              :key="key"
              :value="device"
            >
              {{ device.label }}
            </option>
          </select>
        </div>
        <div>
          <label>
            Ljudkälla:
          </label>
          <select
            v-model="pickedAudioInput"
            class="select select-bordered"
          >
            <option
              v-for="(device, key) in audioDevices"
              :key="key"
              :value="device"
            >
              {{ device.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="w-fit mt-6">
        <div>
          <video
            autoplay
            class="w-56 bg-emerald-300"
            ref="sourceVideoTag"
          />
        </div>
        <label class="label cursor-pointer">
          <input
            v-model="cropIsActive"
            type="checkbox"
            class="toggle"
          >
              
          <span class="label-text ml-2">Avgränsa sändarvinkel</span>
          <div
            class="tooltip cursor-help flex items-center"
            data-tip="Kräver mer prestanda här på på sändarsidan eftersom datorn måste beskära varje videoframe i realtid"
          >
            <span class="material-icons">info</span>
          </div>
        </label>
      </div>
      <div
        id="video-crop-container"
        class="w-full"
      >
        <div class="">
          <!-- NOTE: Be sure to keep the slider at step size 5. Otherwise you might end up with a weird chrome? bug in the worker were "x is not sample aligned in plane 1" -->
          <tc-range-slider
            v-show="cropIsActive"
            ref="FOVSlider"
            round="0"
            slider-width="100%"
            slider-height="1rem"
            value1="0"
            value2="100"
            step="5"
            mousewheel-disabled="true"
          />
        </div>
        <video
          :style="videoStyle"
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
// import Slider from '@vueform/slider';
import { isTRPCClientError } from '@/modules/trpcClient';
import type { ProducerInfo } from 'schemas/mediasoup';
import { useVenueStore } from '@/stores/venueStore';
import { useSenderStore } from '@/stores/senderStore';
import { useSoupStore } from '@/stores/soupStore';
import { useIntervalFn, useDebounceFn } from '@vueuse/core';
import VideoFrameWorker from '@/ts/videoFrameWorker?worker';
import type { VideoFrameWorkerMessageData } from '@/ts/videoFrameWorker';
import 'toolcool-range-slider';
import type { RangeSlider } from 'toolcool-range-slider';

const senderStore = useSenderStore();
const venueStore = useVenueStore();

const soup = useSoupStore();

// let wrkr: Worker | undefined = new VideoFrameWorker({name: 'crop that shit!'});
let wrkr: Worker | undefined = undefined;

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
  wrkr?.terminate();
});

const sourceVideoTag = ref<HTMLVideoElement>();
const videoTag = ref<HTMLVideoElement>();
const FOVSlider = ref<RangeSlider>();

const cropIsActive = ref(false);
watch(cropIsActive, (cropIsActive) => {
  if(!FOVSlider.value) {
    console.warn('FOVSlider undefined. Exiting');
    return;
  }
  FOVSlider.value?.addEventListener('change', (evt) => setCropRange(evt as CustomEvent));
  FOVSlider.value!.step = 5;
  
  if(pickedVideoInput.value){
    onDevicePicked(pickedVideoInput.value);
    // sendVideo();
  }
  if(cropIsActive) {
    // pipeThroughCropper();
    debouncedFOVUpdate();
  } else {
    // pipeDirectlyOut();
    // const msg: VideoFrameWorkerMessageData = {
    //   pause: true,
    // };
    // wrkr?.postMessage(msg);
  }
});

const videoStyle = computed(() => {
  if(cropIsActive.value) {
    return {width: `${(cropRange[1]-cropRange[0])}%`, position:'relative', left: `${cropRange[0]}%`};
  }
  return {};
});

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
watch(pickedVideoInput, (pickedDevice) => onDevicePicked(pickedDevice!));

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
  if(cropRange[0] === 0 && cropRange[1] === 100){
    //skip frame transformation
    console.log('TODO. change so we skip frame transformation');
    // soup.replaceVideoProducerTrack(sourceVideoTrack.value);
    // wrkr.terminate();
  }
  if(wrkr) {
    console.log('sending crop message to worker!');
    wrkr.postMessage(message);
  }
  debouncedFOVUpdate();
}
// const sourceVideoTrack = shallowRef<MediaStreamVideoTrack>();
// let sendingVideoStream: MediaStream;
// let sendingVideoTrack: MediaStreamVideoTrack;

// const videoInfo = computed(() => {
//   if(!sourceVideoTrack.value) return undefined;
//   const {width, height, frameRate} = sourceVideoTrack.value.getSettings();
//   return {
//     width, height, frameRate,
//   };
// });

function pipeThroughCropper(sourceVideoTrack: MediaStreamVideoTrack) {
  // if(!sourceVideoTrack.value) {
  //   console.warn('source videotrack was undefined. Returning');
  //   return;
  // }

  const streamProcessor = new MediaStreamTrackProcessor({track: sourceVideoTrack});
  const { readable } = streamProcessor;
  
  const videoTrackGenerator = new MediaStreamTrackGenerator({kind: 'video'});
  const { writable } = videoTrackGenerator;
  
  const message: VideoFrameWorkerMessageData = {
    streams: {
      readable,
      writable,
    },
  };
  wrkr?.terminate();
  wrkr = undefined;
  console.log('creating (new) worker');
  wrkr = new VideoFrameWorker({name: 'crop that shit!'});
  wrkr.postMessage(message, [readable, writable]);
  
  return videoTrackGenerator;
  // sendingVideoTrack = videoTrackGenerator;
  // return {videoTrack: videoTrackGenerator, stream: new MediaStream([videoTrackGenerator])};
  // sendingVideoStream = new MediaStream([videoTrackGenerator]);
  // if(soup.videoProducer.producer){
  //   soup.replaceVideoProducerTrack(sendingVideoTrack);
  // }
}
// function pipeDirectlyOut() {

//   // if(!sourceVideoTrack.value) {
//   //   console.warn('source videotrack was undefined. Returning');
//   //   return;
//   // }
//   // sendingVideoStream = new MediaStream([sourceVideoTrack.value]);
//   // sendingVideoTrack = sourceVideoTrack.value;
//   wrkr?.terminate();

//   // if(soup.videoProducer.producer){
//   //   soup.replaceVideoProducerTrack(sendingVideoTrack);
//   // }

// }

async function sendVideo() {
  if(!sourceStream) {
    console.error('sourceStream is undefined');
    return;
  }
  const [vTrack] = await sourceStream.getVideoTracks();
  // sourceVideoTrack.value = vTrack;
  if(sourceVideoTag.value) {
    console.log('sourceVideoTag:', sourceVideoTag.value);
    
    // sourceVideoTag.value.srcObject = new MediaStream([sourceVideoTrack.value]);
    sourceVideoTag.value.srcObject = sourceStream;
  }
  
  let sendingTrack: MediaStreamVideoTrack;
  let stream: MediaStream;
  if(cropIsActive.value){
    console.log('piping through cropper!!');
    sendingTrack = pipeThroughCropper(vTrack);
    stream = new MediaStream([sendingTrack]);
  }else {
    console.log('not piping through cropper');
    sendingTrack = vTrack;
    stream = sourceStream;
    wrkr?.terminate();
    wrkr = undefined;
    // pipeDirectlyOut();
  }
  
  videoTag.value!.srcObject = stream;

  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  if(soup.videoProducer.producer){
    await soup.replaceVideoProducerTrack(sendingTrack);
  }else{
    await soup.produce({
      track: sendingTrack,
      producerInfo,
    });
  }
}

let sourceStream: MediaStream;
async function onDevicePicked(videoDevice: MediaDeviceInfo){
  console.log('starting video!!');
  const deviceId = videoDevice.deviceId;
  sourceStream = await navigator.mediaDevices.getUserMedia({
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
  console.log(sourceStream);

  sendVideo();
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