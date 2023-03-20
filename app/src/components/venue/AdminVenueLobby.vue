<template>
  <div>
    <div class="flex mb-4">
      <h2 class="flex-1 card-title">
        VR-lobby
      </h2>
      <button
        v-if="venueStore.currentVenue?.vrSpace"
        class="btn btn-primary"
        @click="openVirtualSpace"
      >
        Gå in i VR-lobby
      </button>
      <button
        v-else
        class="btn btn-primary"
        @click="createVirtualSpace"
      >
        Lägg till VR-lobby
      </button>
    </div>
    <div>
      <p>
        Inställningar för VR-lobby...
      </p>
      <div v-if="venueStore.currentVenue?.vrSpace">
        <h3>3D-modell</h3>
        <!-- TODO: Why isn't virtualSpace3DModel recognised by TS? -->
        {{venueStore.currentVenue.vrSpace.virtualSpace3DModel}}
        <AdminUploadModelForm />
      </div>
    </div>
    {{ venueStore.currentVenue?.vrSpace }}
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';
import { useVenueStore } from '@/stores/venueStore';
import AdminUploadModelForm from '@/components/venue/AdminUploadModelForm.vue';

// Use imports
const router = useRouter();
const connectionStore = useConnectionStore();
const venueStore = useVenueStore();

const openVirtualSpace = async () => {
  await connectionStore.client.vr.openVrSpace.mutate();
  await connectionStore.client.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

const createVirtualSpace = async () => {
  await connectionStore.client.vr.createVrSpace.mutate();
};

</script>

