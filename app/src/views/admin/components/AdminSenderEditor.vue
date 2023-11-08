<template>
  <div class="w-full aspect-video bg-base-200">
    <video
      class=""
      ref="videoTag"
      id="main-video"
      autoplay
    />
    
    <div class="flex flex-row gap-2 justify-center p-4">
      <button
        v-if="newName === undefined"
        class="btn btn-primary btn-sm"
        @click="newName = ''"
      >
        skapa ny kameraprofil
      </button>
      <form 
        v-else
        class="card p-2 bg-slate-400 flex flex-col flex-nowrap gap-2"
        @submit.prevent="newName? adminStore.createCameraFromSender(newName, props.sender.senderId): undefined"
      >
        <input
          type="text"
          class="input input-sm"
          v-model="newName"
        >
        <div class="flex flex-nowrap gap-2">
          <button
            type="submit"
            class="btn btn-primary flex-auto"
          >
            <span class="material-icons">add</span>
          </button>
          <button
            @click="newName = undefined"
            class="btn flex-auto"
          >
            <span class="material-icons">cancel</span>
          </button>
        </div>
      </form>
      <template
        v-for="listedCamera in adminStore.adminOnlyVenueState?.cameras"
        :key="listedCamera.cameraId"
      >
        <button
          v-if="!listedCamera.senderAttached"
          class="btn btn-sm"
          @click="attachSenderToCamera(listedCamera.cameraId)"
        >
          {{ listedCamera.name }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { CameraId, ConnectionId } from 'schemas';
import { useAdminStore } from '@/stores/adminStore';

const videoTag = ref<HTMLVideoElement>();

const newName = ref<string>();

const adminStore = useAdminStore();

const props = defineProps<{
  sender: NonNullable<typeof adminStore.adminOnlyVenueState>['detachedSenders'][ConnectionId]
}>();

onMounted(() => {
  consumeVideoTrack();
});
onUnmounted(() => {
});


function attachSenderToCamera(cameraId: CameraId){
  adminStore.setSenderForCamera(cameraId, props.sender.senderId);
}

async function consumeVideoTrack( ) {
  const consumeResult = await adminStore.consumeDetachedSenderVideo(props.sender.connectionId);
  console.log('consumerResult', consumeResult);
  if(!consumeResult) return;
  videoTag.value!.srcObject = new MediaStream([consumeResult.track]);
}
watch(() => props.sender, async (newSender) => {
  console.log('sender changed:', newSender);
  consumeVideoTrack();
});

</script>