<template>
  <div v-if="!soup.userHasInteracted">
    <button
      @click="loadStuff()"
      class="btn btn-primary"
    >
      Starta
    </button>
  </div>
  <div v-else>
    <h1>Watching camera: {{ props.cameraId }}</h1>
    <div class="flex">
      <div>
        <video
          autoplay
          ref="videoTag"
        />
        <audio
          autoplay
          ref="audioTag"
        />
        <!-- <ConsumerElement
          kind="video"
          :track="receivedTracks.videoTrack"
        /> -->
      </div>
      <pre class="max-w-xl">
      {{ soup.consumers }}
    </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConnectionStore } from '@/stores/connectionStore';
import { useSoupStore } from '@/stores/soupStore';
import type { CameraId, VenueId } from 'schemas';
import { onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from 'vue';
import ConsumerElement from '@/components/ConsumerElement.vue';
import { useVenueStore } from '@/stores/venueStore';
import { useCameraStore } from '@/stores/cameraStore';

const props = defineProps<{
  venueId: VenueId,
  cameraId: CameraId,
}>();

const videoTag = ref<HTMLVideoElement>();
const audioTag = ref<HTMLAudioElement>();

const soup = useSoupStore();
const venueStore = useVenueStore();
const camera = useCameraStore();
// const receivedTracks : NonNullable<Awaited<ReturnType<typeof camera.consumeCurrentCamera>>> = reactive({
//   videoTrack: undefined,
//   audioTrack: undefined,
// });

watch(() => camera.producers, async (updatedProducers) => {
  console.log('cameraProducers were updated:', toRaw(updatedProducers));
  const rcvdTracks = await camera.consumeCurrentCamera();
  if(rcvdTracks){
    // receivedTracks.videoTrack = rcvdTracks.videoTrack;
    if(rcvdTracks.videoTrack && videoTag.value){
      videoTag.value.srcObject = new MediaStream([rcvdTracks.videoTrack]);
    }
    if(rcvdTracks.audioTrack && audioTag.value){
      audioTag.value.srcObject = new MediaStream([rcvdTracks.audioTrack]);
    }
    // receivedTracks.audioTrack = rcvdTracks.audioTrack;
  }
});

async function loadStuff(){
  soup.userHasInteracted = true;
  if(!venueStore.currentVenue){
    await venueStore.joinVenue(props.venueId);
  }
  if(!soup.deviceLoaded){
    await soup.loadDevice();
  }
  await soup.createReceiveTransport();

  await camera.joinCamera(props.cameraId);
  console.log('joined camera');
}

onMounted(async () => {
  if(soup.userHasInteracted){
    await loadStuff();
  }
});

onBeforeUnmount(() => {
  console.log('Leaving camera');
  camera.leaveCurrentCamera();
});


</script>
