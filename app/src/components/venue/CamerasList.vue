<template>
  <table class="table table-sm table-auto">
    <thead>
      <tr>
        <th
          colspan="10"
        >
          Status för kameror
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
          <div

            v-if="venueStore.currentVenue?.mainCameraId === camera.cameraId"
            class="tooltip z-40" 
            data-tip="Denna kamera är vald som startvinkel när besökaren ansluter till sändningen"
          >
            <span
              class="material-icons cursor-help"
            >start</span>
          </div>
        </td>
        <td class="">
          <div
            class="tooltip"
            :data-tip="camera.cameraType === 'panoramic360'?'Detta är en 360-kamera':'Detta är en vanlig kamera'"
          >
            <span class="material-icons cursor-help">{{ camera.cameraType === 'panoramic360'?'panorama_photosphere_select':'panorama' }}</span>
          </div>
        </td>
        <td v-if="camera.name !== ''">
          {{ camera.name }}
        </td>
        <td v-else>
          {{ camera.cameraId.substring(0, 8) }}...
        </td>
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
        <td
          colspan="2"
          v-if="!camera.senderAttached"
          class="text-center"
        >
          <div
            class="tooltip tooltip-error"
            data-tip="Ingen sändarstation ansluten till denna kameraprofil! Dubbelkolla dina sändarstationer"
          >
            <span class="material-icons text-error cursor-help">desktop_access_disabled</span>
          </div>
        </td>
        <template v-else>
          <td>
            <div
              class="tooltip"
              :class="{'tooltip-error': !camera.producers.audioProducer}"
              :data-tip="camera.producers.audioProducer?'Kameran skickar ljud':'Kameran skickar inget ljud'"
            >
              <span
                class="material-icons cursor-help"
                :class="[!camera.producers.audioProducer? 'text-error':'text-success']"
              >{{ camera.producers.audioProducer?'volume_up':'volume_off' }}</span>
            </div>
          </td>
          <td>
            <div
              class="tooltip"
              :class="{'tooltip-error': !camera.producers.videoProducer}"
              :data-tip="camera.producers.videoProducer?'Kameran skickar video':'Kameran skickar ingen video! Dubbelkolla sändarstationen!'"
            >
              <span
                class="material-icons cursor-help"
                :class="[!camera.producers.videoProducer? 'text-error':'text-success']"
              >{{ camera.producers.videoProducer?'videocam':'videocam_off' }}</span>
            </div>
          </td>
        </template>
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

