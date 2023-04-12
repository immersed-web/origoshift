<template>
  <div>
    <div class="min-h-screen">
      <div class="absolute bottom-5 left-5 z-10 rounded-md bg-base-100 p-2 flex items-center gap-4">
        <button
          class="btn btn-primary"
        >
          Öppna 360-vy för samtliga deltagare
        </button>
      </div>
      <div class="absolute top-5 right-5 z-10 rounded-md bg-base-100 text-xs p-2">
        <div class="flex flex-col">
          <div>Modell: {{ venueStore.modelUrl }}</div>
          <div class="flex items-center">
            <span>Navmesh: {{ venueStore.navmeshUrl }}</span>
            <label class="label cursor-pointer">
              <span class="material-icons mr-2">visibility</span>
              <input
                type="checkbox"
                class="toggle toggle-success toggle-xs"
                v-model="showNavMesh"
              >
            </label>
          </div>
          <div>
            Clients:
            <div v-if="clientStore.clientTransforms">
              <div
                v-for="[id, transform] in Object.entries(clientStore.clientTransforms)"
                :key="id"
              >
                <div class="collapse">
                  <input
                    type="checkbox"
                    class="min-h-0"
                  >
                  <div class="collapse-title min-h-0 p-0">
                    {{ id }}
                  </div>
                  <pre class="collapse-content">
                    {{ transform }}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="min-h-screen z-0">
      <VrAFrame
        :model-url="venueStore.modelUrl"
        :navmesh-url="venueStore.navmeshUrl"
        :show-nav-mesh="showNavMesh"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VrAFrame from '../../components/lobby/VrAFrame.vue';
import { useClientStore } from '@/stores/clientStore';
import { useVenueStore } from '@/stores/venueStore';
import { ref } from 'vue';

const venueStore = useVenueStore();
const clientStore = useClientStore();

const showNavMesh = ref<boolean>();

</script>

