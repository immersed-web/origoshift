<template>
  <div>
    <div class="flex mb-4">
      <div class="flex-1">
        <h1 class="text-5xl font-bold">
          {{ venueStore.currentVenue?.name }}
        </h1>
      </div>
      <div class="flex-1">
        <!-- <ul class="steps">
          <li class="step step-primary">
            Grundinställningar
          </li>
          <li class="step step-primary">
            Ställ in 360
          </li>
          <li class="step step-primary">
            Ställ in VR-lobby
          </li>
          <li class="step">
            Gå live!
          </li>
        </ul> -->
      </div>
    </div>
    <div class="flex items-stretch">
      <div class="flex-1">
        <!-- <div class="border shadow-xl card w-96 bg-base-100">
          <div class="card-body"> -->
        <AdminVenueSettings />
        <!-- </div>
        </div> -->
      </div>
      <div class="divider divider-horizontal" />
      <div class="flex-1">
        <!-- <div class="border shadow-xl card w-96 bg-base-100">
          <div class="card-body"> -->
        <AdminVenueLobby />
        <!-- </div>
        </div> -->
      </div>
      <div class="divider divider-horizontal" />
      <div class="flex-1">
        <!-- <div class="border shadow-xl card w-96 bg-base-100">
          <div class="card-body"> -->
        <AdminVenue360 />
        <!-- </div>
        </div> -->
      </div>
    </div>
    <!-- <pre>
      {{ venueStore.currentVenue }}
    </pre> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClientStore } from '@/stores/clientStore';
import { useVenueStore } from '@/stores/venueStore';
import { useConnectionStore } from '@/stores/connectionStore';
import AdminVenueSettings from '@/components/venue/AdminVenueSettings.vue';
import AdminVenueLobby from '@/components/venue/AdminVenueLobby.vue';
import AdminVenue360 from '@/components/venue/AdminVenue360.vue';

// Router
const router = useRouter();

// Stores
const connectionStore = useConnectionStore();
const clientStore = useClientStore();
const venueStore = useVenueStore();

// View functionality
onMounted(() => {
  clientStore.updateClientState();
});

const openLobby = async () => {
  await connectionStore.client.vr.openVrSpace.mutate();
  await connectionStore.client.vr.enterVrSpace.mutate();
  router.push({name: 'lobby'});
};

const updateVenue = async () => {
  if(venueStore.currentVenue){
    console.log('Update venue', venueStore.currentVenue?.name);
    venueStore.updateVenue();
  }
};

</script>

