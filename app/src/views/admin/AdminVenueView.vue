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
    <div>
      <ul class="steps w-full">
        <li class="step step-info">
          <div class="flex items-center text-sm">
            <span class="mr-2 material-icons">meeting_room</span>
            {{ venueStore.currentVenue?.doorsOpeningTime?.toLocaleString() }}
          </div>
          <span class="text-xs">
            Dörrarna till eventet öppnas <i>automatiskt</i> den angivna tiden.<br>
            Om eventet har en VR-lobby har besökaren möjlighet att gå in i denna.
          </span>
        </li>
        <li class="step step-info">
          <div class="flex items-center text-sm">
            <span class="mr-2 material-icons">curtains</span>
            {{ venueStore.currentVenue?.streamStartTime?.toLocaleString() }}
          </div>
          <span class="text-xs">
            Eventets/360-sändningens <i>planerade</i> starttid, synlig för besökarna.<br>
            Ni startar eventet <i>manuellt</i> när föreställningen startar.
          </span>
        </li>
        <li class="step step-info">
          <div class="flex items-center text-sm">
            <span class="mr-2 material-icons">curtains_closed</span>
            Manuellt avslut
          </div>
          <span class="text-xs">
            Eventet/360-sändningen avslutas.<br>
            Ni avslutar eventet <i>manuellt</i> när föreställningen är slut.
          </span>
        </li>
      </ul>
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

