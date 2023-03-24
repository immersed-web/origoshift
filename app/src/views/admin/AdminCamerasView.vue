<template>
  <h1>Cameras view</h1>
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
        <td>{{ camera.name }}</td>
        <td>
          <button
            :disabled="!camera.senderAttached"
            class="btn btn-primary"
          >
            Consume
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <SenderList />
  <div class="flex gap-4">
    <div>
      <pre>
        {{ venueStore.currentVenue }}
      </pre>
      <pre>
        {{ adminStore.connectedSenders }}
      </pre>
    </div>
    <div class="p-4 border-2">
      <div
        v-for="[k, sender] in adminStore.connectedSenders"
        :key="k"
      >
        {{ sender.username }}
        <button
          class="btn btn-primary"
          @click="adminStore.createCameraFromSender(`camera_${k.substring(0, 5)}`, sender.senderId)"
        >
          Create camera
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import SenderList from '@/components/venue/SenderList.vue';
import {useVenueStore} from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';


const venueStore = useVenueStore();
const adminStore = useAdminStore();

</script>
