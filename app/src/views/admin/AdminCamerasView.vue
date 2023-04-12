<template>
  <h1>Cameras view</h1>
  <div class="flex gap-4">
    <table class="table">
      <thead>
        <tr>
          <th colspan="0">
            Kameror
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="camera in adminStore.adminOnlyVenueState?.cameras"
          :key="camera.cameraId"
        >
          <td>{{ camera.name }} sändare: {{ camera.senderAttached }}</td>
          <td>
            <button
              @click="deleteCamera(camera.cameraId)"
              class="btn btn-error"
            >
              Ta bort
            </button>
          </td>
          <td>
            <button
              @click="consumeCamera(camera.cameraId)"
              :disabled="!camera.isStreaming"
              class="btn btn-primary"
            >
              Consume
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div ref="mediaElements">
      <ConsumerElement
        v-for="[k, c] in soupStore.consumers"
        :track="c.track"
        :kind="c.kind"
        :key="k"
      />
      <pre
        v-for="[k, c] in soupStore.consumers"
        :key="k"
      >
      {{ c.id }}
      {{ c.kind }}
      {{ c.track }}
      </pre>
      <!-- <video
        ref="videoTag"
        autoplay
      /> -->
    </div>
    <div class="p-4 border-2">
      <div
        v-for="sender in adminStore.adminOnlyVenueState?.detachedSenders"
        :key="sender.connectionId"
      >
        {{ sender.username }}
        <button
          class="btn btn-primary"
          @click="adminStore.createCameraFromSender(`camera_${sender.connectionId.substring(0, 5)}`, sender.senderId)"
        >
          Create camera
        </button>
      </div>
    </div>
  </div>
  <pre>
        {{ venueStore.currentVenue }}
      </pre>
  <pre>
        <!-- {{ adminStore.connectedSenders }} -->
      </pre>
</template>

<script setup lang="ts">
// import SenderList from '@/components/venue/SenderList.vue';
import {useVenueStore} from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';
import { useSoupStore } from '@/stores/soupStore';
import { onBeforeMount, ref } from 'vue';
import type { CameraId } from 'schemas';
import { useConnectionStore } from '@/stores/connectionStore';
import ConsumerElement from '@/components/ConsumerElement.vue';

const mediaElements = ref<HTMLDivElement>();

const connection = useConnectionStore();
const venueStore = useVenueStore();
const adminStore = useAdminStore();
const soupStore = useSoupStore();

async function consumeCamera(cameraId: CameraId){
  await connection.client.camera.joinCamera.mutate({cameraId});
  await soupStore.consumeCurrentCamera();
}

async function deleteCamera(cameraId: CameraId){
  const response = adminStore.deleteCamera(cameraId);
  console.log(response);
}

onBeforeMount(async ()=> {
  if(!soupStore.deviceLoaded){
    await soupStore.loadDevice();
  }
  soupStore.createReceiveTransport();
});

</script>
