<template>
  <div>
    <form @submit.prevent="uploadFiles">
      <div class="form-control w-full max-w-xs">
        <label class="label">
          <span class="label-text">Välj en fil</span>
        </label>
        <input
          type="file"
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

import { type Ref, ref } from 'vue';
import axios from 'axios';

const config = {
  // url: process.env.FILESERVER_URL+process.env.FILESERVER_PORT,
  url: 'http://localhost:9002/upload',
  headers: {
    'Content-Type': 'application/json',
  },
};

const fileInput : Ref<HTMLInputElement | undefined> = ref();
const uploadFiles = async () => {
  // if (process.env.FILESERVER_URL) {
  try {
    if(fileInput.value?.files){
      console.log(fileInput.value, fileInput.value.files);
      const data = new FormData();
      Array.from(fileInput.value.files).forEach(file => {
        data.append('body', file, file.name);
      });
      // data.append('file', file, file.name)

      const response = await axios.post(config.url, data, {
        headers: {
          // 'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          'Content-Type': 'multipart/form-data;',
        },
        timeout: 60000,
      });
      console.log(response);
    }
  } catch (err) {
    console.log(err);
    // throw new Error(err);
  }
};
// };

</script>

<style scoped>

</style>
