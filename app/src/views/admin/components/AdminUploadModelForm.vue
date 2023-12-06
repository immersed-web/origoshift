<template>
  <div v-if="!url">
    <form @submit.prevent="uploadFile">
      <div class="form-control">
        <input
          type="file"
          accept=".gltf, .glb"
          class="file-input file-input-bordered max-w-xs"
          ref="fileInput"
          @change="onFilesPicked"
        >
        <div class="flex flex-nowrap items-center gap-2">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFileSizeOk"
          >
            Ladda upp {{ props.name }}
          </button>
          <div
            :class="{'invisible': uploadProgress === 0}"
            class="radial-progress text-primary"
            :style="`--value:${smoothedProgress}; --size:2.5rem`"
          >
            {{ smoothedProgress.toFixed(0) }}%
          </div>
        </div>
      </div>
    </form>
  </div>
  <div v-else>
    <form @submit.prevent="removeFile">
      <div class="flex items-center">
        <div class="flex-1 flex items-center gap-4">
          <!-- <i class="text-sm truncate">{{ venueStore.modelUrl }}</i> -->
          <span class="flex-1" />
          <div>
            <button
              type="submit"
              class="btn btn-error"
            >
              <span class="material-icons mr-2">delete</span>
              Ta bort {{ props.name }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">

import { type Ref, ref, computed } from 'vue';
import { useTransition } from '@vueuse/core';
import axios from 'axios';
import { useConnectionStore } from '@/stores/connectionStore';
import { useVenueStore } from '@/stores/venueStore';
import { useAuthStore } from '@/stores/authStore';

// Props & emits
const props = defineProps({
  model: {type: String, required: true, validator(value: string){return ['model','navmesh'].includes(value);} },
  name: {type: String, default: '3D-modell'},
});

const connectionStore = useConnectionStore();
const venueStore = useVenueStore();
const authStore = useAuthStore();

const url = computed(() => {
  return props.model === 'model' ? venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelUrl : venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.navmeshUrl;
});

const config = {
  url: `https://${import.meta.env.EXPOSED_SERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PATH}`,
  headers: {
    'Content-Type': 'application/json',
  },
};

const maxSize = 50 * 1024 * 1024;
const isFileSizeOk = ref(false);
const uploadProgress = ref(0);
const smoothedProgress = useTransition(uploadProgress);
function onFilesPicked(evt: Event){
  console.log('files picked:', evt);
  if(fileInput.value?.files){
    for(const file of fileInput.value.files) {
      if(file.size > maxSize){
        isFileSizeOk.value = false;
        return;
      }
    }
  }
  isFileSizeOk.value = true;

}

const fileInput : Ref<HTMLInputElement | undefined> = ref();
const uploadFile = async () => {
  try {
    if(fileInput.value?.files){
      const data = new FormData();
      Array.from(fileInput.value.files).forEach(file => {
        data.append('gltf', file, file.name);
      });

      if(!venueStore.currentVenue?.venueId){
        console.error('no currentVenue');
        return;
      }
      // data.set('venueId', venueStore.currentVenue.venueId);
      // data.set('token', authStore.tokenOrThrow());

      const response = await axios.post(config.url + '/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data;',
          'token': authStore.tokenOrThrow(),
          'venueId': venueStore.currentVenue.venueId,
          'fileNameSuffix': props.model,
        },
        timeout: 60000,
        onUploadProgress(progressEvent) {
          console.log(progressEvent);
          if(!progressEvent.progress) return;
          uploadProgress.value = progressEvent.progress * 100;
        },
        
      });
      uploadProgress.value = 0;
      // console.log(response);
      if(props.model === 'model'){
        create3DModel(response.data.modelUrl);
      }
      else if (props.model === 'navmesh'){
        updateNavmesh(response.data.modelUrl);
      }
    }
  } catch (err) {
    console.log(err);
    // throw new Error(err);
  }
};

const create3DModel = async (modelUrl: string) => {
  await connectionStore.client.vr.create3DModel.mutate({modelUrl});
};

const updateNavmesh = async (modelUrl: string) => {
  await connectionStore.client.vr.updateNavmesh.mutate({modelUrl});
};

// Remove 3d model
const removeFile = async () => {
  try {

    const body = {
      fileName: url.value,
    };

    console.log(body);

    await axios.post(config.url + '/remove', body, {
      timeout: 60000,
    });
    if(props.model === 'model'){
      remove3DModel();
    }
    else if (props.model === 'navmesh'){
      updateNavmesh('');
    }
  } catch (err) {
    console.log(err);
    // throw new Error(err);
  }
};

const remove3DModel = async () => {
  if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId){
    await connectionStore.client.vr.remove3DModel.mutate({modelId: venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId});
  }
};

</script>

<style scoped>

.break {
  word-break: break-all;
}

#aframe {

}

</style>
