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
          v-for="camera in venueStore.currentVenue?.cameras"
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
              v-for="p in camera.producers"
              :key="p.producerId"
              @click="consumeProducer(p.producerId)"
              :disabled="!camera.senderAttached"
              class="btn btn-primary"
            >
              Consume
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <video
        ref="videoTag"
        autoplay
      />
    </div>
    <div class="p-4 border-2">
      <div
        v-for="sender in venueStore.currentVenue?.detachedSenders"
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
        {{ adminStore.connectedSenders }}
      </pre>
</template>


<script setup lang="ts">
import SenderList from '@/components/venue/SenderList.vue';
import {useVenueStore} from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';
import { useSoupStore } from '@/stores/soupStore';
import { onBeforeMount, ref } from 'vue';
import type { ProducerId } from 'schemas/mediasoup';
import type { CameraId } from 'schemas';

const videoTag = ref<HTMLVideoElement>();

const venueStore = useVenueStore();
const adminStore = useAdminStore();
const soupStore = useSoupStore();

async function consumeProducer(producerId: ProducerId) {
  const { consumerId, track } = await  soupStore.consume(producerId);
  if(!videoTag.value){
    console.error('no videoElemetn');
    return;
  }
  videoTag.value.srcObject = new MediaStream([track]);
  videoTag.value.play();
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
