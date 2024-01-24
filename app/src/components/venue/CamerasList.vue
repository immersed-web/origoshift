<template>
  <table class="table table-sm table-auto">
    <thead>
      <tr>
        <th
          colspan="10"
        >
          Kameror
        </th>
      </tr>
    </thead>
    <tbody class="border">
      <tr
        v-for="camera in adminStore.adminOnlyVenueState?.cameras"
        :key="camera.cameraId"
        :class="{'': !camera.isStreaming}"
      >
        <td>
          <!-- <div
            class="tooltip z-40" 
            data-tip="Denna kamera är vald som startvinkel när besökaren ansluter till sändningen"
          > -->
          <span
            v-if="venueStore.currentVenue?.mainCameraId === camera.cameraId"
            class="material-icons cursor-help"
          >start</span>
          <!-- </div> -->
        </td>
        <td class="">
          <div
            class="tooltip"
            :data-tip="camera.cameraType === 'panoramic360'?'Detta är en 360-kamera':'Detta är en vanlig kamera'"
          >
            <span class="material-icons cursor-help">{{ camera.cameraType === 'panoramic360'?'panorama_photosphere_select':'panorama' }}</span>
          </div>
        </td>
        <td>{{ camera.name }} ({{ camera.cameraId.substring(0, 5) }}...)</td>
        <td>
          <div
            class="tooltip"
            data-tip="Denna kamera är takhängd"
          >
            <span
              :class="{hidden: camera.orientation!==180}"
              class="material-icons cursor-help"
            >{{ camera.orientation === 180?'cameraswitch':'cameraswitch' }}</span>
          </div>
        </td>
        <td v-if="!camera.senderAttached">
          <div
            class="tooltip tooltip-error"
            data-tip="Ingen sändarstation ansluten till denna kameraprofil! Dubbelkolla dina sändarstationer"
          >
            <span class="material-icons text-error">desktop_access_disabled</span>
          </div>
        </td>
        <td v-else>
          <div
            class="tooltip tooltip-error"
            data-tip="Sändarstationen skickar ingen video! Dubbelkolla sändarstationen!"
          >
            <span
              class="material-icons"
              :class="{'text-error': !camera.isStreaming, 'text-success': camera.isStreaming}"
            >{{ camera.isStreaming?'videocam':'videocam_off' }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <table
    class="table"
    v-if="adminStore.adminOnlyVenueState?.detachedSenders"
  >
    <thead>
      <tr>
        <th
          colspan="10"
          class="text-left"
        >
          Ej tilldelade sändare
        </th>
      </tr>
    </thead>
    <tbody class="border">
      <tr
        v-for="sender in adminStore.adminOnlyVenueState?.detachedSenders"
        :key="sender.connectionId"
      >
        <td>{{ sender.connectionId.substring(0, 5) }}...</td>
        <td>{{ sender.username }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useAdminStore } from '@/stores/adminStore';
import { useVenueStore } from '@/stores/venueStore';

// Use imports
const venueStore = useVenueStore();
const adminStore = useAdminStore();

</script>

