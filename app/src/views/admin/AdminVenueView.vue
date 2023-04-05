<template>
  <div>
    <div class="flex mb-4">
      <div class="flex-1">
        <h1>
          {{ venueStore.currentVenue?.name }}
        </h1>
      </div>
      <div>
        <button
          class="btn btn-error"
          @click="deleteVenue"
        >
          <span class="mr-2 material-icons">delete</span>
          Ta bort event
        </button>
      </div>
    </div>
    <!-- <div class="flex">
      <div>
        <div class="flex items-center">
          <span class="mr-2 material-icons">meeting_room</span>
          {{ venueStore.currentVenue?.doorsOpeningTime?.toLocaleString() }}
        </div>
        <div class="flex items-center">
          <span class="mr-2 material-icons">curtains</span>
          {{ venueStore.currentVenue?.streamStartTime?.toLocaleString() }}
        </div>
      </div>
    </div> -->
    <div class="flex justify-between">
      <div class="flex-1">
        <div class="relative">
          <div class="z-10 avatar placeholder">
            <div class="w-10 rounded-full bg-primary text-neutral-content">
              <span class="material-icons">meeting_room</span>
            </div>
          </div>
          <div class="absolute top-0 flex items-center w-full h-full">
            <div class="z-0 w-full h-2 bg-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-center text-sm">
            {{ venueStore.currentVenue?.doorsOpeningTime?.toLocaleString() }}
          </div>
          <ol class="text-xs">
            <li>Dörrarna till eventet öppnas <i>automatiskt</i> den angivna tiden.</li>
            <li>Om eventet har en VR-lobby har besökaren möjlighet att gå in i denna.</li>
            <li>Samtliga besökare slussas automatiskt vidare till 360-sändningen när eventet startar.</li>
          </ol>
        </div>
      </div>
      <div class="flex-1">
        <div class="relative">
          <div class="z-10 avatar placeholder">
            <div class="w-10 rounded-full bg-primary text-neutral-content">
              <span class="material-icons">curtains</span>
            </div>
          </div>
          <div class="absolute top-0 flex items-center w-full h-full">
            <div class="z-0 w-full h-2 bg-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-center text-sm">
            {{ venueStore.currentVenue?.streamStartTime?.toLocaleString() }}
          </div>
          <ol class="text-xs">
            <li>360-sändningens <i>planerade</i> starttid, synlig för besökarna.</li>
            <li>Ni startar sändningen <i>manuellt</i> när ni är redo.</li>
          </ol>
        </div>
      </div>
      <div class="flex-1">
        <div class="relative">
          <div class="z-10 avatar placeholder">
            <div class="w-10 rounded-full bg-primary text-neutral-content">
              <span class="material-icons">curtains_closed</span>
            </div>
          </div>
          <div class="absolute top-0 flex items-center w-full h-full">
            <div class="z-0 w-full h-2 bg-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-center text-sm">
            Manuellt avslut
          </div>
          <ol class="text-xs">
            <li>Ni avslutar sändningen <i>manuellt</i>.</li>
          </ol>
        </div>
      </div>
      <div>
        <div class="relative">
          <div class="z-10 avatar placeholder">
            <div class="w-10 rounded-full bg-primary text-neutral-content">
              <span class="material-icons">door_front</span>
            </div>
          </div>
        </div>
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
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import AdminVenueSettings from './components/AdminVenueSettings.vue';
import AdminVenueLobby from './components/AdminVenueLobby.vue';
import AdminVenue360 from './components/AdminVenue360.vue';

// Router
const router = useRouter();

// Stores
const venueStore = useVenueStore();

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

