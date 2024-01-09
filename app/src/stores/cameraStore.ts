import { defineStore } from 'pinia';
import { useConnectionStore } from './connectionStore';
import type { CameraId } from 'schemas';
import type { RouterOutputs } from '@/modules/trpcClient';
import { computed, ref } from 'vue';
import { useSoupStore } from './soupStore';
import { THREE } from 'aframe';
import { useVenueStore } from './venueStore';

type _ReceivedPublicCameraState = RouterOutputs['camera']['joinCamera'];

export const useCameraStore = defineStore('camera', () => {
  const connection = useConnectionStore();
  const soup = useSoupStore();
  const venueStore = useVenueStore();
  const currentCamera = ref<_ReceivedPublicCameraState>();


  function coordsToAngles({x, y}: {x:number, y: number}){
    // const angleY = 270 - 360 * x; 
    const angleY = 360 - 360 * x; 
    // while(angleY < 0) angleY += 360;
    const angleX = 90 - (180 * y);
    return {angleX, angleY};
  }
  function anglesToCoords({angleX, angleY}: {angleX:number, angleY: number}){
    console.log('anglesToCoords input', angleX, angleY);
    // const x = 1 - ((angleY+10*360)%360)/360; 
    const x = 1 - (THREE.MathUtils.euclideanModulo(angleY, 360))/360; 
    const y = (90 - angleX) / 180;
    return {x, y};
  }
  const viewOrigin = computed(() => {
    if(!currentCamera.value) return undefined;
    const { x, y } = currentCamera.value.viewOrigin;
    return {
      ...currentCamera.value.viewOrigin,
      ...coordsToAngles({ x, y }),
    };
  });
  
  const FOV = computed(() => {
    if(!currentCamera.value) return undefined;

    const { fovStart, fovEnd } = currentCamera.value.FOV;
    return {
      ...currentCamera.value.FOV,
      phiLength: (fovEnd-fovStart) * 360,
      phiStart: fovStart * 360,
    };
  });
  
  const isRoofMounted = computed(() => {
    return currentCamera.value?.orientation === 180 ? true : false;
  });
  
  const is360Camera = computed(()=> {
    return currentCamera.value?.cameraType === 'panoramic360';
  });

  const portals = computed(() => {
    if(!currentCamera.value) return undefined;
    const newObj: Record<CameraId, {angleX:number; angleY: number, cameraName: string} & (typeof currentCamera.value.portals)[CameraId]> = {};
    // NOTE: We need to make sure the portals keep its order. Thats why there is a random call to sort below.
    // otherwise aframe gets angry and fails to render all the portals
    for(const [k , p ] of Object.entries(currentCamera.value.portals).sort()){
      // const angleY = 270 - 360 * p.x; 
      // const angleX = 90 - (180 * p.y);
      newObj[p.toCameraId as CameraId] = {
        cameraName: venueStore.currentVenue!.cameras[p.toCameraId].name,
        // style: {

        //   left: Math.trunc(width.value * p.x) + 'px',
        //   top: Math.trunc(height.value * p.y) + 'px',
        // },
        toCameraId: p.toCameraId as CameraId,
        x: p.x,
        y: p.y,
        distance: p.distance,
        ...coordsToAngles(p),
        // angleX,
        // angleY,
      };
    }
    return newObj;
    // return currentCamera.value?.portals.map(p => {
    //   const angleY = -360 * p.x + -90; 
    //   const angleX = 90 - (180 * p.y);
    //   return {
    //     // style: {

    //     //   left: Math.trunc(width.value * p.x) + 'px',
    //     //   top: Math.trunc(height.value * p.y) + 'px',
    //     // },
    //     cameraId: p.toCameraId as CameraId,
    //     x: p.x,
    //     y: p.y,
    //     distance: p.distance,
    //     angleX,
    //     angleY,
    //   };
    // });
  });

  // const currentCameraReactive = toReactive(currentCamera);

  const producers = computed(() => {
    // console.log('computed producers re-evaluated');
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
    const mainAudio = venueStore.currentVenue?.mainAudioProducerId;
    if(mainAudio){
      console.log('CONSUMING MAIN AUDIO!');
      const {track} = await soup.consume(mainAudio);
      receivedTracks.audioTrack = track;
    }
    else if(currentCamera.value.producers.audioProducer){
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
    portals,
    FOV,
    is360Camera,
    isRoofMounted,
    viewOrigin,
    // currentCameraReactive,
    utils: {
      coordsToAngles,
      anglesToCoords,
    },
    producers,
    joinCamera,
    leaveCurrentCamera,
    consumeCurrentCamera,
  };
});
