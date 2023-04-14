import { defineStore } from 'pinia';
import { useConnectionStore } from './connectionStore';
import type { CameraId } from 'schemas';
import type { RouterOutputs } from '@/modules/trpcClient';
import { computed, ref } from 'vue';
import { useSoupStore } from './soupStore';
import { toReactive } from '@vueuse/core';

type _ReceivedPublicCameraState = RouterOutputs['camera']['joinCamera'];

export const useCameraStore = defineStore('camera', () => {
  const connection = useConnectionStore();
  const soup = useSoupStore();
  // const currentCamera: _ReceivedPublicCameraState | Record<string, never> = reactive({});
  const currentCamera = ref<_ReceivedPublicCameraState>();

  // const currentCameraReactive = toReactive(currentCamera);

  const producers = computed(() => {
    console.log('computed producers re-evaluated');
    return currentCamera.value?.producers;
  });


  connection.client.camera.subCameraStateUpdated.subscribe(undefined, {
    onData({data, reason}) {
      console.log(`subscription received new cameraState (${reason}):`, data);

      currentCamera.value = data;
      // patch existing state if exists
      // if(currentCamera.value){
      //   for(const k of Object.keys(currentCamera.value)) {
      //     const key = k as keyof typeof data;
      //     // if(!key) continue;
      //     const d = data[key];
      //     const p = currentCamera.value[key];
      //   }
      // }else {
      //   currentCamera.value = data;
      // }
    },
  });
  async function joinCamera(cameraId: CameraId){
    // console.log('Joining camera!!!!');
    currentCamera.value = await connection.client.camera.joinCamera.mutate({ cameraId });
    // console.log('joined Camera!!!!');
  }

  async function leaveCurrentCamera() {
    await connection.client.camera.leaveCurrentCamera.mutate();
    currentCamera.value = undefined;
  }

  async function consumeCurrentCamera(){
    if(!currentCamera.value?.producers){
      return;
    }
    const receivedTracks: { videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack } = {
      // videoTrack: undefined,
      // audioTrack: undefined,
    };
    if(currentCamera.value.producers.videoProducer){
      const {track} = await soup.consume(currentCamera.value.producers.videoProducer.producerId);
      receivedTracks.videoTrack = track;
    }
    if(currentCamera.value.producers.audioProducer){
      const {track} = await soup.consume(currentCamera.value.producers.audioProducer.producerId);
      receivedTracks.audioTrack = track;
    }
    return receivedTracks;
    // for(const p of Object.values(currentCamera.value.producers)) {
    //   if(!p) continue;
    // soup.consume(p.producerId);
    // }
  }

  return {
    currentCamera,
    // currentCameraReactive,
    producers,
    joinCamera,
    leaveCurrentCamera,
    consumeCurrentCamera,
  };
});
