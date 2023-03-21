<template>
  <div v-if="venueStore.currentVenue?.vrSpace?.virtualSpace3DModel">
    <pre>
      {{ venueStore.currentVenue?.vrSpace?.virtualSpace3DModel }}
    </pre>
    <form @submit.prevent="removeFile">
      <div class="flex items-center">
        <div class="flex-1 flex items-center">
          <!-- <span class="material-icons mr-2">view_in_ar</span> -->
          <i>{{ venueStore.currentVenue?.vrSpace?.virtualSpace3DModel.modelUrl }}</i>
        </div>
        <button
          type="submit"
          class="btn btn-error"
        >
          <span class="material-icons mr-2">delete</span>
          Ta bort 3D-modell
        </button>
      </div>
    </form>
  </div>
  <div v-else>
    <form @submit.prevent="uploadFile">
      <div class="form-control w-full max-w-xs">
        <label class="label">
          <span class="label-text">Välj en fil</span>
        </label>
        <input
          type="file"
          accept=".gltf"
          class="file-input file-input-bordered w-full max-w-xs"
          ref="fileInput"
        >
      </div>
      <button
        type="submit"
        class="btn btn-primary"
      >
        Ladda upp
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">

import { type Ref, ref, computed } from 'vue';
import axios from 'axios';
import { useConnectionStore } from '@/stores/connectionStore';
import { useVenueStore } from '@/stores/venueStore';

const connectionStore = useConnectionStore();
const venueStore = useVenueStore();

const config = {
  url: `${import.meta.env.EXPOSED_FILESERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PORT}`,
  headers: {
    'Content-Type': 'application/json',
  },
};

const fileInput : Ref<HTMLInputElement | undefined> = ref();
const uploadFile = async () => {
  try {
    if(fileInput.value?.files){
      console.log(fileInput.value, fileInput.value.files);
      const data = new FormData();
      Array.from(fileInput.value.files).forEach(file => {
        data.append('gltf', file, file.name);
      });

      const response = await axios.post(config.url + '/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data;',
        },
        timeout: 60000,
      });
      // console.log(response);
      create3DModel(response.data.modelUrl);
    }
  } catch (err) {
    console.log(err);
    // throw new Error(err);
  }
};

const create3DModel = async (modelUrl: string) => {
  await connectionStore.client.vr.create3DModel.mutate({modelUrl});
};

// Remove 3d model
const removeFile = async () => {
  try {

    const body = {
      fileName: venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelUrl,
    };

    console.log(body);

    const response = await axios.post(config.url + '/remove', body, {
      timeout: 60000,
    });
    console.log(response);
    remove3DModel(response.data.modelUrl);
  } catch (err) {
    console.log(err);
    // throw new Error(err);
  }
};

const remove3DModel = async (modelUrl: string) => {
  if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId){
    await connectionStore.client.vr.remove3DModel.mutate({modelId: venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId});
  }
};

</script>

<style scoped>

</style>
