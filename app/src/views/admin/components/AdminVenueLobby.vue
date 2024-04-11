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
        v-if="!venueStore.currentVenue?.vrSpace"
        class="btn btn-primary"
        @click="createVirtualSpace"
      >
        Lägg till VR-lobby
      </button>
      <!-- <button
        v-else
        class="btn btn-primary"
        @click="openVirtualSpace"
        :disabled="!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel"
      >
        Gå in i VR-lobby
        <span class="ml-2 material-icons">open_in_new</span>
      </button> -->
    </div>
    <div
      v-auto-animate
    >
      <div
        v-if="venueStore.currentVenue?.vrSpace"
        class="flex flex-col gap-4"
      >
        <div class="flex items-center justify-start gap-2 -mb-2">
          <h3>
            3D-modell 
          </h3>
          <div
            class="tooltip cursor-help select-none before:text-left before:whitespace-pre-line flex flex-col max-h-fit justify-center"
            data-tip="Använd musen för att interagera med modellen.
                      Klicka och dra: Rotera bilden
                      Högermus och dra: Panorera längs golvytan
                      Scrolla: Zooma"
          >
            <span class="material-icons">help</span>
          </div>
        </div>
        <div
          v-if="venueStore.modelUrl"
          class="grid gap-2"
        >
          <VrAFramePreview
            class="flex-1 border"
            :model-url="venueStore.modelUrl"
            :navmesh-url="venueStore.navmeshUrl"
            :cursor-target="currentCursorType"
            @cursor-placed="onCursorPlaced"
          />
          <div class="flex gap-2">
            <input
              type="radio"
              :value="undefined"
              class="hidden"
              v-model="currentCursorType"
            >
            <input
              type="radio"
              value="spawnPosition"
              aria-label="Placera startplats"
              class="btn btn-sm btn-primary"
              v-model="currentCursorType"
            >
            <input
              type="radio"
              value="entrancePosition"
              aria-label="Placera streaming-entré"
              class="btn btn-sm btn-primary"
              v-model="currentCursorType"
            >
            <button
              v-if="currentCursorType"
              class="btn btn-sm btn-circle"
              @click="currentCursorType = undefined"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          <label class="label gap-2">
            <span class="label-text font-semibold whitespace-nowrap">
              Entré rotation
            </span>
            <input
              type="range"
              min="0"
              max="360"
              v-model.number="entranceRotation"
              @change="onEntranceRotationCommited"
              class="range"
            >
          </label>
          <label class="label gap-2">
            <span class="label-text font-semibold whitespace-nowrap">
              Startplats storlek
            </span>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              v-model.number="spawnRadius"
              @change="onSpawnRadiusCommited"
              class="range"
            >
          </label>
        </div>
        <div>
          <div>
            <h4>3D-modell för miljön</h4>
            <AdminUploadModelForm model-type="model" />
          </div>
          <div v-if="venueStore.currentVenue?.vrSpace?.virtualSpace3DModel">
            <h4>3D-modell för gåbara ytor (navmesh)</h4>
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
        <div class="flex gap-4">
          <h4>Färg på himmelen</h4>
          <input class="rounded-md border-black border border-2" type="color" :value="venueStore.currentVenue.vrSpace.virtualSpace3DModel.skyColor" @input="setSkyColor">
          <!-- <p>{{ skyColor }}</p> -->
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
import VrAFramePreview from '@/components/lobby/LobbyAFramePreview.vue';
import { ref, watch, onMounted } from 'vue';
import { throttle } from 'lodash-es';
// import { useAdminStore } from '@/stores/adminStore';

// Use imports
const router = useRouter();
const connectionStore = useConnectionStore();
const venueStore = useVenueStore();

onMounted(() => {
  const storeRot = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.entranceRotation;
  if(storeRot){
    entranceRotation.value = storeRot;
  }
  const sRadius = venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.spawnRadius;
  if(sRadius){
    spawnRadius.value = sRadius;
  }

});

const skyColor = ref();

const currentCursorType = ref<'spawnPosition' | 'entrancePosition' | undefined>();
const entranceRotation = ref(0);
watch(entranceRotation, (rot) => {
  if(!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel) return;
  venueStore.currentVenue.vrSpace.virtualSpace3DModel.entranceRotation = rot;
});

const spawnRadius = ref(0);
watch(spawnRadius, (radius) => {
  if(!venueStore.currentVenue?.vrSpace?.virtualSpace3DModel) return;
  venueStore.currentVenue.vrSpace.virtualSpace3DModel.spawnRadius = radius;
});

type Point = [number, number, number];

function onCursorPlaced(point: Point){
  console.log('cursor placed:', point);
  if(currentCursorType.value === 'entrancePosition'){
    setEntrancePosition(point);
  } else if(currentCursorType.value === 'spawnPosition' ){
    setSpawnPosition(point);
  }
  currentCursorType.value = undefined;
}

async function setEntrancePosition(point: Point){
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    data: {
      entrancePosition: point,
    },
  });
}
async function setSpawnPosition(point: Point){
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    data: {
      spawnPosition: point,
    },
  });
}

async function onEntranceRotationCommited() {
  console.log('rotation changed', entranceRotation.value);
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    reason: 'entrance rotation updated',
    data: {
      entranceRotation: entranceRotation.value,
    },
  });
}

async function onSpawnRadiusCommited() {
  console.log('spawn radius changed', spawnRadius.value);
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    reason: 'spawn radius updated',
    data: {
      spawnRadius: spawnRadius.value,
    },
  });
}

const setSkyColor = throttle(async (evt: InputEvent) => {
  // console.log(evt.data);
  // console.log(evt.target);
  // return;
  const modelId = venueStore.currentVenue?.vrSpace?.virtualSpace3DModelId;
  if(!modelId) return;
  await connectionStore.client.vr.update3DModel.mutate({
    vr3DModelId: modelId,
    reason: 'skycolor updated',
    data: {
      skyColor: evt.target.value,
    }
  })
}, 800, {trailing: true});

const openVirtualSpace = async () => {

  await connectionStore.client.vr.enterVrSpace.mutate();
  const routeData = router.resolve({name: 'adminLobby'});
  window.open(routeData.href, '_blank');
};

const createVirtualSpace = async () => {
  await connectionStore.client.vr.createVrSpace.mutate();
};

// const updateScale = async () => {
//   if(venueStore.currentVenue?.vrSpace?.virtualSpace3DModel?.modelId){
//     await connectionStore.client.vr.update3DModel.mutate({
//       modelId: venueStore.currentVenue.vrSpace.virtualSpace3DModel.modelId,
//       scale: modelScale.value,
//     });
//   }
// };

</script>

