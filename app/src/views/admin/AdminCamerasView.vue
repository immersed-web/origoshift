<template>
  <div class="flex gap-4">
    <div class="flex-initial">
      <ul class="menu bg-base-200 rounded-box">
        <li class="menu-title mx-4 my-2">
          Kameraprofiler:
        </li>
        <li
          v-for="camera in adminStore.adminOnlyVenueState?.cameras"
          :key="camera.cameraId"
        >
          <a
            :class="{active: editedCameraId === camera.cameraId}"
            @click="editedCameraId = camera.cameraId; editedSenderId = undefined"
          >{{ camera.name }}</a>
        </li>
      </ul>
      <ul
        v-if="hasDetachedSenders"
        class="menu bg-base-200 rounded-box mt-6"
      >
        <li class="menu-title mx-4 my-2">
          Ej tilldelade sändare:
        </li>
        <li
          v-for="sender in adminStore.adminOnlyVenueState?.detachedSenders"
          :key="sender.connectionId"
        >
          <a
            @click="editedSenderId = sender.senderId; editedCameraId = undefined"
            :class="{active: editedSenderId === sender.senderId}"
          >
            {{ sender.senderId.substring(0, 5) }}
          </a>
        </li>
      </ul>
    </div>
    <div class="flex-auto rounded-box overflow-hidden">
      <template v-if="editedCameraId">
        <AdminCameraEditor :camera-id="editedCameraId" />
      </template>
      <template v-else-if="editedSenderId">
        <AdminSenderEditor :sender-id="editedSenderId" />
      </template>
    </div>
  </div>
  <div
    v-if="false"
    class="flex gap-1"
  >
    <table class="table">
      <thead>
        <tr>
          <th colspan="10">
            Kameror
          </th>
        </tr>
      </thead>
      <tbody class="border">
        <tr
          v-for="camera in adminStore.adminOnlyVenueState?.cameras"
          :key="camera.cameraId"
        >
          <td>
            <p>
              {{ camera.name }} <br>
              sändare: {{ camera.senderAttached }} <br>
              streaming: {{ camera.isStreaming }}
            </p>
          </td>
          <td>
            <button
              @click="deleteCamera(camera.cameraId)"
              class="btn btn-error btn-sm"
            >
              Ta bort
            </button>
          </td>
          <td>
            <button
              @click="consumeCamera(camera.cameraId)"
              :disabled="!camera.isStreaming"
              class="btn btn-primary btn-sm"
            >
              Consume
            </button>
          </td>
          <td>
            <button
              @click="setPortal(camera.cameraId)"
              class="btn btn-primary btn-sm"
            >
              SetPortal
            </button>
          </td>
          <td>
            <button
              @click="editedCameraId = camera.cameraId"
              class="btn btn-primary btn-sm"
            >
              Edit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <!-- <div
        v-for="[k, c] in soupStore.consumers"
        :key="k"
        class="relative"
      >
        <div
          class="absolute w-5 h-5 rounded-full bg-red-700 -translate-x-1/2 -translate-y-1/2"
          :style="{left: portalPosition.absoluteX +'px', top: portalPosition.absoluteY + 'px'}"
        />
        <ConsumerElement
          :track="c.track"
          :kind="c.kind"
          @click="positionPortal"
        />
      </div> -->
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
          @click="adminStore.createCameraFromSender(`camera_${sender.senderId.substring(0, 5)}`, sender.senderId)"
        >
          Create camera
        </button>
      </div>
    </div>
  </div>
  <!-- <pre>
    {{ adminStore.adminOnlyVenueState }}
  </pre>
  <pre>
    {{ venueStore.currentVenue }}
  </pre> -->
</template>

<script setup lang="ts">
// import {useVenueStore} from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';
import { useSoupStore } from '@/stores/soupStore';
import { computed, onBeforeMount, reactive, ref } from 'vue';
import type { CameraId, CameraPortalUpdate, SenderId } from 'schemas';
import { useCameraStore } from '@/stores/cameraStore';
import AdminCameraEditor from './components/AdminCameraEditor.vue';
import AdminSenderEditor from './components/AdminSenderEditor.vue';

// const venueStore = useVenueStore();
const adminStore = useAdminStore();
const hasDetachedSenders = computed(() => {
  for (const key in adminStore.adminOnlyVenueState?.detachedSenders) {
    return true;
  }
  return false;
});
const soupStore = useSoupStore();
const cameraStore = useCameraStore();

const portalPosition: Partial<CameraPortalUpdate['portal']> & {absoluteX?: number, absoluteY?: number} = reactive({
  x: undefined,
  y: undefined,
  absoluteX: undefined,
  absoluteY: undefined,
  distance: 4,
});

const editedCameraId = ref<CameraId>();
const editedSenderId = ref<SenderId>();

async function consumeCamera(cameraId: CameraId){
  // await connection.client.camera.joinCamera.mutate({cameraId});
  await cameraStore.joinCamera(cameraId);
  await cameraStore.consumeCurrentCamera();
}

async function deleteCamera(cameraId: CameraId){
  const response = adminStore.deleteCamera(cameraId);
  console.log(response);
}

async function setPortal(cameraId: CameraId) {
  console.log(cameraStore.currentCamera?.cameraId, cameraId, portalPosition);
  const {x, y, distance } = portalPosition;
  if(!cameraStore.currentCamera?.cameraId || !x || !y || !distance){
    return;
  }
  adminStore.setPortal({
    cameraId: cameraStore.currentCamera.cameraId,
    toCameraId: cameraId,
    portal: {distance, x, y},
  });
}

onBeforeMount(async ()=> {
  if(!soupStore.deviceLoaded){
    await soupStore.loadDevice();
  }
  soupStore.createReceiveTransport();
});

function positionPortal(ev: MouseEvent) {
  const clickedElement = ev.target as HTMLElement;
  const x = ev.offsetX / clickedElement.offsetWidth;
  const y = ev.offsetY / clickedElement.offsetHeight;
  console.log('coords: ', x, y);
  portalPosition.x = x;
  portalPosition.absoluteX = ev.offsetX;
  portalPosition.y = y;
  portalPosition.absoluteY = ev.offsetY;
}
</script>
