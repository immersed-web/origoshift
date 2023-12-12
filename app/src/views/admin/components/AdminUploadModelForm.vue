<template>
  <div v-if="!modelExists">
    <form @submit.prevent="uploadFile">
      <div class="form-control gap-1">
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
            :disabled="uploadDisabled"
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
        <div
          v-if="error"
          role="alert"
          class="alert alert-error text-sm"
        >
          {{ error }}
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

import { ref, computed, shallowRef } from 'vue';
import { autoResetRef, useTransition } from '@vueuse/core';
import axios from 'axios';
import { useConnectionStore } from '@/stores/connectionStore';
import { useVenueStore } from '@/stores/venueStore';
import { useAuthStore } from '@/stores/authStore';

// Props & emits
// const props = defineProps({
//   model: {type: String, required: true, validator(value: string){return ['model','navmesh'].includes(value);} },
//   name: {type: String, default: '3D-modell'},
// });
const props =  withDefaults(defineProps<{
  modelType: 'model' | 'navmesh',
  name?: string,
}>(),{
  name: '3D-modell',
});

const connectionStore = useConnectionStore();
const venueStore = useVenueStore();
const authStore = useAuthStore();

const modelExists = computed(() => {
  return props.modelType === 'model' ? !!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelFileFormat : !!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.navmeshFileFormat;
});

const config = {
  url: `https://${import.meta.env.EXPOSED_SERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PATH}`,
  headers: {
    'Content-Type': 'application/json',
  },
};

const uploadedFileName = computed(() => {
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  const modelFileFormat = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelFileFormat;
  const navmeshFileFormat = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.navmeshFileFormat;
  const fileFormat = props.modelType === 'model' ? modelFileFormat : navmeshFileFormat;
  if(!modelId || !fileFormat) {
    return undefined;
  }
  return `${modelId}.${props.modelType}.${fileFormat}`;
});

const uploadDisabled = computed(() => {
  return !pickedFile.value || !extension.value || uploadProgress.value !== 0;
});

const pickedFile = shallowRef<File>();
const error = autoResetRef<string | undefined>(undefined, 3000);
const extension = ref<'gltf' | 'glb'>();
const maxSize = 50 * 1024 * 1024;
const uploadProgress = ref(0);
const smoothedProgress = useTransition(uploadProgress);
function onFilesPicked(evt: Event){
  pickedFile.value = undefined;
  console.log('files picked:', evt);
  if(!fileInput.value?.files){
    return;
  }
  const file = fileInput.value.files[0];
  if(file.size > maxSize){
    error.value = `maxstorlek (${maxSize/1024/1024}MB) överskriden`;
    return;
  }
  const ext =  file.name.split('.').pop();
  if(ext !== 'glb' && ext !== 'gltf'){
    // isFileOk.value = false;
    return;
  }
  extension.value = ext;
  pickedFile.value = file;
}

const fileInput = ref<HTMLInputElement>();
const uploadFile = async () => {
  if(!extension.value) {
    return;
  }
  const ctl = new AbortController();
  try {
    if(pickedFile.value){
      const data = new FormData();
      data.append('gltf', pickedFile.value, pickedFile.value.name);
      // Array.from(fileInput.value.files).forEach(file => {
      //   data.append('gltf', file, file.name);
      // });
      pickedFile.value = undefined;

      if(!venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId){
        console.error('no virtualSpace3DModelId');
        return;
      }
      // data.set('venueId', venueStore.currentVenue.venueId);
      // data.set('token', authStore.tokenOrThrow());

      const response = await axios.post(config.url + '/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data;',
          'token': authStore.tokenOrThrow(),
          // 'venueId': venueStore.currentVenue.venueId,
          'model-id': venueStore.currentVenue.vrSpace.virtualSpace3DModelId,
          'file-name-suffix': props.modelType,
        },
        signal: ctl.signal,
        timeout: 60000,
        onUploadProgress(progressEvent) {
          console.log(progressEvent);
          if(!progressEvent.progress) return;
          uploadProgress.value = progressEvent.progress * 100;
        },
      });
      console.log(extension);
      update3DModel(extension.value);
      uploadProgress.value = 0;
      // console.log(response);
      // if(props.model === 'model'){
      //   create3DModel(response.data.modelUrl);
      // }
      // else if (props.model === 'navmesh'){
      //   updateNavmesh(response.data.modelUrl);
      // }
    }
  } catch (err) {
    console.error(err);
    error.value = 'failed to send file';
    uploadProgress.value = 0;
    extension.value = undefined;
    ctl.abort('failed to send file');

    // throw new Error(err);
  }
};

// const create3DModel = async (modelUrl: string) => {
//   await connectionStore.client.vr.create3DModel.mutate({modelUrl});
// };

const update3DModel = async (extension: 'gltf' | 'glb' | null) => {
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    data: {
      modelFileFormat: props.modelType === 'model'? extension : undefined,
      navmeshFileFormat: props.modelType === 'navmesh' ? extension : undefined,
    },
    reason: props.modelType === 'model' ? '3D-model updated' : 'navmesh model updated',
  });

};

// Remove 3d model
const removeFile = async () => {
  try {

    const body = {
      fileName: uploadedFileName.value,
    };

    console.log(body);

    await axios.post(config.url + '/remove', body, {
      headers: {
        'token': authStore.tokenOrThrow(),
      },
      timeout: 60000,
    });
    update3DModel(null);
  } catch (err) {
    console.log(err);
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
