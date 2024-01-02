<template>
  <div ref="domOutlet" />
  <div class="w-full aspect-video relative">
    <div class="rounded-br-xl bg-neutral/60 absolute p-2 top-0 left-0 z-10">
      <form
        v-if="isEditingCameraName"
        class="flex flex-nowrap items-center gap-2"
        @submit.prevent="setCameraName"
      >
        <input
          v-model="camera.currentCamera!.name"
          type="text"
          class="input input-sm"
        >
        <button
          class="btn btn-sm btn-primary btn-circle"
        >
          <span class="material-icons">save</span>
        </button>
      </form>
      <div
        v-else
        class="flex flex-nowrap items-center gap-2"
      >
        <p class="text-neutral-content text-lg font-semibold drop-shadow-lg ">
          {{ camera.currentCamera?.name }}
        </p>
        <button
          @click="isEditingCameraName = true"
          class="btn btn-sm btn-primary btn-circle"
        >
          <span class="material-icons">edit</span>
        </button>
      </div>
      <div class="form-control">
        <label class="label">
          <input
            type="checkbox"
            @change="updateCurrentCamera({ cameraType: camera.is360Camera?'normal':'panoramic360'}, 'cameraType')"
            :checked="camera.is360Camera"
            class="toggle toggle-primary"
          >
          <span class="pl-2 label-text text-neutral-content cursor-pointer">360-kamera</span>
        </label>
        <label class="label">
          <input
            type="checkbox"
            @change="updateCurrentCamera({orientation: camera.isRoofMounted?0:180}, 'camera rotation')"
            :checked="camera.isRoofMounted"
            class="toggle toggle-primary"
          >
          <span class="pl-2 label-text text-neutral-content cursor-pointer">takhängd</span>
        </label>
      </div>
    </div>
    <a-scene
      embedded
      class="w-full"
      ref="sceneTag"
    >
      <CameraView
        :camera-id="(props.cameraId as CameraId)"
        :venue-id="(adminStore.adminOnlyVenueState?.venueId as VenueId)"
        editable
        ref="CameraViewRef"
      />
    </a-scene>
    <div class="bottom-0 absolute w-full bg-neutral/50 flex flex-row gap-4 justify-center p-4">
      <template
        v-for="listedCamera in camerasWithPortalInfo"
        :key="listedCamera.cameraId"
      >
        <div v-if="listedCamera.cameraId !== camera.currentCamera?.cameraId">
          <div 
            v-if="listedCamera.hasPortal"
            class="group card bg-primary/75 outline outline-2 outline-offset-1 outline-primary select-none text-primary-content p-4 grid grid-cols-2 items-center justify-items-center gap-2"
          >
            <div class="col-span-full row-start-1 justify-self-center group-hover:invisible">
              {{ listedCamera.name }}
            </div>
            <button
              @click="CameraViewRef?.createOrCenterOnPortal(listedCamera.cameraId)"
              class="row-start-1 col-start-1 col-span-1 btn btn-square btn-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">visibility</span>
            </button>
            <button 
              @click="adminStore.deletePortal(camera.currentCamera!.cameraId, listedCamera.cameraId)" 
              class="row-start-1 col-start-2 col-span-1 btn btn-square btn-error opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
          <div
            v-else
            class="group card outline outline-2 outline-neutral-content/20 bg-neutral/75 select-none text-neutral-content p-4 grid grid-cols-2 items-center justify-items-center gap-2"
          >
            <div class="col-span-full row-start-1 justify-self-center">
              {{ listedCamera.name }}
            </div>
            <button 
              @click="CameraViewRef?.createOrCenterOnPortal(listedCamera.cameraId)" 
              class="row-start-1 col-start-2 col-span-1 btn btn-square btn-accent place-self-end opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="material-icons">add_circle</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCameraStore } from '@/stores/cameraStore';
import { computed, ref, provide } from 'vue';
import type { CameraId, VenueId } from 'schemas';
import { useAdminStore } from '@/stores/adminStore';
import CameraView from '@/components/CameraView.vue';
import { aFrameSceneProvideKey } from '@/modules/injectionKeys';
import type { Scene } from 'aframe';


const sceneTag = ref<Scene>();
const domOutlet = ref<HTMLDivElement>();
provide(aFrameSceneProvideKey, {sceneTag, domOutlet});


const CameraViewRef = ref<InstanceType<typeof CameraView>>();

const isEditingCameraName = ref(false);

const camera = useCameraStore();
const adminStore = useAdminStore();
const camerasWithPortalInfo = computed(() => {
  const portalCameraIds = camera.portals? Object.keys(camera.portals) : [];
  console.log('portalCameraIds in computed:', portalCameraIds);
  const camerasWithPortalInfo = [];
  if(!adminStore.adminOnlyVenueState?.cameras) return [];
  for(const [key, cam] of Object.entries(adminStore.adminOnlyVenueState.cameras)){
    // console.log('includes input:', cam.cameraId, portalCameraIds);
    const hasPortal = portalCameraIds.includes(cam.cameraId);
    // console.log('includes result:', hasPortal);
    const newCam = { hasPortal, ...cam};
    camerasWithPortalInfo.push(newCam);
  }
  return camerasWithPortalInfo;
});

const props = defineProps<{
  cameraId: CameraId
}>();

function updateCurrentCamera(input: Parameters<typeof adminStore.updateCamera>[1], reason?: string){
  if(!camera.currentCamera) return;
  const adminStore = useAdminStore();
  adminStore.updateCamera(camera.currentCamera.cameraId, input, reason);
}

function setCameraName(){
  updateCurrentCamera({name: camera.currentCamera?.name}, 'camera name');
  isEditingCameraName.value = false;
}

</script>