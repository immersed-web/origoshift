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
          <tc-range-slider
            ref="FOVSlider"
            step="1"
            round="0"
            slider-width="100%"
            slider-height="1rem"
            value1="0"
            value2="100"
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
import { useIntervalFn, useDebounceFn } from '@vueuse/core';
import 'toolcool-range-slider';

const senderStore = useSenderStore();
const venueStore = useVenueStore();

const router = useRouter();
const soup = useSoupStore();

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
  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  const producerId = await soup.produce({
    // producerId: restoredProducerId,
    track: audioTrack.value,
    producerInfo,
  });

}

const cropRange = reactive([0, 100]);
function setCropRange(evt: CustomEvent) {
  console.log(evt.detail.values);
  cropRange[0] = (evt.detail.values[0]);
  cropRange[1] = (evt.detail.values[1]);

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
  
  // eslint-disable-next-line no-undef
  const streamProcessor = new MediaStreamTrackProcessor({track: vTrack});
  const { readable } = streamProcessor;
  
  // eslint-disable-next-line no-undef
  const videoTrackGenerator = new MediaStreamTrackGenerator({kind: 'video'});
  const { writable } = videoTrackGenerator;
  
  let mostRecentUsableCrop: {x:number, width: number} = {x:0, width:100};
  // eslint-disable-next-line no-undef
  function transform(frame: VideoFrame, controller: TransformStreamDefaultController) {
    const dimensions = videoInfo.value;
    if(!dimensions?.width || !dimensions?.height) {
      console.log('no videodimensions available. passing frames through');
      controller.enqueue(frame);
      // frame.close();
      return;
    }
    const x = Math.trunc(dimensions.width * cropRange[0]*0.01);
    const width = Math.trunc(dimensions.width * (cropRange[1]-cropRange[0])*0.01);
    // console.log('croprange:', cropRange);
    // console.log('transform parameters', {x, width});
    // Cropping from an existing video frame is supported by the API in Chrome 94+.
    // eslint-disable-next-line no-undef
    try{

      // eslint-disable-next-line no-undef
      const newFrame = new VideoFrame(frame, {
        visibleRect: {
          x,
          width,
          y: 0,
          height: dimensions.height,
        },
      });
      controller.enqueue(newFrame);
      mostRecentUsableCrop = {x, width};
      frame.close();
    } catch(e) {
      console.error(x, mostRecentUsableCrop, e);
      // controller.enqueue(frame);
      try {

        // eslint-disable-next-line no-undef
        const newFrame = new VideoFrame(frame, {
          visibleRect: {
            x: mostRecentUsableCrop.x,
            width: Math.min(width, dimensions.width-mostRecentUsableCrop.x),
            y: 0,
            height: dimensions.height,
          },
        });
        controller.enqueue(newFrame);
        frame.close();
      }catch(e) {
        console.error('recovery transform failed also', e, mostRecentUsableX);
        controller.enqueue(frame);
      }
    }
  }
  readable.pipeThrough(new TransformStream({transform})).pipeTo(writable);
  
  const transformedStream = new MediaStream([videoTrackGenerator]);
  
  // sourceVideoTrack.value = videoTrackGenerator;
  transformedVideoTrack = videoTrackGenerator;
  videoTag.value!.srcObject = transformedStream;

  // videoTag.value!.srcObject = stream;
  videoTag.value!.play();

  const producerInfo: ProducerInfo = {
    // deviceId: pickedVideoInput.value?.deviceId,
    isPaused: false,
  };
  if(soup.videoProducer.producer){
    await soup.replaceVideoProducerTrack(transformedVideoTrack);
  }else{
    // const restoredProducerId = senderStore.savedProducers.get(deviceId)?.producerId;
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