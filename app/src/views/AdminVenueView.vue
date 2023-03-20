<template>
  <div>
    <div class="flex mb-4">
      <div class="flex-1">
        <h1 class="">
          {{ venueStore.currentVenue?.name }}
        </h1>
      </div>
      <div>
        <button
          class="btn btn-error"
          @click="deleteVenue"
        >
          <span class="material-icons mr-2">delete</span>
          Ta bort event
        </button>
      </div>
    </div>
    <div class="divider" />
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
import { onMounted, onUnmounted } from 'vue';
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

onUnmounted(async () => {
  // if(venueStore.currentVenue){
  //   await venueStore.leaveVenue();
  //   router.push({name: 'adminHome'});
  // }
});

const deleteVenue = async () => {
  await venueStore.deleteCurrentVenue();
  router.push({name: 'adminHome'});
};

</script>

