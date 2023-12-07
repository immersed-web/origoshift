<template>
  <div>
    <div
      class="flex mb-4"
      v-auto-animate
    >
      <h2 class="flex-1">
        VR-lobby
      </h2>
      <button
        v-if="venueStore.currentVenue?.vrSpace"
        class="btn btn-primary"
        @click="openVirtualSpace"
        :disabled="!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel"
      >
        Gå in i VR-lobby
        <span class="ml-2 material-icons">open_in_new</span>
      </button>
      <button
        v-else
        class="btn btn-primary"
        @click="createVirtualSpace"
      >
        Lägg till VR-lobby
      </button>
    </div>
    <div
      v-auto-animate
    >
      <p>
        Inställningar för VR-lobby...
      </p>
      <!-- <pre> {{ venueStore.currentVenue?.vrSpace }}</pre> -->
      <div
        v-if="venueStore.currentVenue?.vrSpace"
        class="mt-4"
      >
        <h3>3D-modell</h3>
        <div class="grid gap-2">
          <VrAFramePreview
            v-if="venueStore.modelUrl"
            class="flex-1 border"
            :model-url="venueStore.modelUrl"
            :navmesh-url="venueStore.navmeshUrl"
          />
          <div>
            <h4>3D-modell</h4>
            <AdminUploadModelForm model-type="model" />
          </div>
          <div v-if="venueStore.currentVenue?.vrSpace?.virtualSpace3DModel">
            <h4>Navmesh</h4>
            <AdminUploadModelForm
              model-type="navmesh"
              name="navmesh"
            />
            <!-- <h4>Skala</h4>
            <input
              class="w-full max-w-xs input input-bordered"
              type="number"
              v-model="modelScale"
              @change="updateScale"
            > -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/stores/connectionStore';
import { useVenueStore } from '@/stores/venueStore';
import AdminUploadModelForm from './AdminUploadModelForm.vue';
import VrAFramePreview from '@/components/lobby/VrAFramePreview.vue';
import { onMounted, ref } from 'vue';

// Use imports
const router = useRouter();
const connectionStore = useConnectionStore();
const venueStore = useVenueStore();

const modelScale = ref(1);
onMounted(() => {
  modelScale.value = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.scale || 1;
});

const openVirtualSpace = async () => {
  // await connectionStore.client.vr.openVrSpace.mutate();
  await connectionStore.client.vr.enterVrSpace.mutate();
  router.push({name: 'adminLobby'});
  // TODO: Open in new tab, without losing superadmin login
  // const routeData = router.resolve({name: 'adminLobby'});
  // window.open(routeData.href, '_blank');
};

const createVirtualSpace = async () => {
  await connectionStore.client.vr.createVrSpace.mutate();
};

const updateScale = async () => {
  if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId){
    await connectionStore.client.vr.update3DModel.mutate({
      modelId: venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId,
      scale: modelScale.value,
    });
  }
};

</script>

