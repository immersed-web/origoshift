<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="">
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
    <StepsContainer>
      <!-- Visibility -->
      <StepsItem
        :icon="venueStore.currentVisibilityDetails?.icon"
      >
        <template #title>
          Synlighet: {{ venueStore.currentVisibilityDetails?.name }}
        </template>
        {{ venueStore.currentVisibilityDetails?.description }}
      </StepsItem>

      <!-- Lobby -->
      <StepsItem
        icon="nightlife"
      >
        <template #title>
          <span
            class="material-icons text-sm"
            :class="venueStore.currentVenue?.doorsAreOpen ? 'text-green-500' : 'text-red-500'"
          >circle</span>
          Lobbyn är {{ venueStore.currentVenue?.doorsAreOpen ? 'öppen' : 'stängd' }}
        </template>
        <div v-auto-animate>
          <div v-if="venueStore.currentVenue?.doorsOpeningTime">
            <span>Listad öppningstid: </span>
            <strong> {{ venueStore.currentVenue?.doorsOpeningTime?.toLocaleString() }}</strong>
          </div>
        </div>
        <div v-auto-animate>
          <div
            v-if="!venueStore.currentVenue?.doorsAutoOpen"
            class="flex items-center"
          >
            <div class="flex-1">
              {{ venueStore.currentVenue?.doorsOpeningTime ? 'Ni öppnar lobbyn manuellt vid utsatt tid.' : 'Om ni önskar, kan ni öppna lobbyn manuellt' }}
            </div>
            <div class="">
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                @click="updateDoors(!venueStore.currentVenue?.doorsManuallyOpened)"
              >
                {{ !venueStore.currentVenue?.doorsManuallyOpened ? "Öppna" : "Stäng" }} lobbyn
              </button>
            </div>
          </div>
          <div
            v-else
            class="flex-1"
          >
            Lobbyn öppnas automatiskt vid utsatt tid.
          </div>
        </div>
      </StepsItem>

      <!-- Streaming starts -->
      <StepsItem
        icon="curtains"
      >
        <template #title>
          <span
            class="material-icons text-sm"
            :class="venueStore.currentVenue?.streamIsStarted ? 'text-green-500' : 'text-red-500'"
          >circle</span>
          Sändningen är {{ venueStore.currentVenue?.streamIsStarted ? 'igång' : 'ej igång' }}
        </template>
        <div v-auto-animate>
          <div v-if="venueStore.currentVenue?.streamStartTime">
            <span>Listad starttid: </span>
            <strong> {{ venueStore.currentVenue?.streamStartTime?.toLocaleString() }}</strong>
          </div>
        </div>
        <div v-auto-animate>
          <div
            v-if="!venueStore.currentVenue?.streamAutoStart"
            class="flex items-center"
          >
            <div class="flex-1">
              {{ venueStore.currentVenue?.streamStartTime ? 'Ni startar sändningen manuellt vid utsatt tid.' : 'Om ni önskar, kan ni starta sändningen manuellt' }}
            </div>
            <div class="">
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                @click="updateStream(!venueStore.currentVenue?.streamManuallyStarted)"
              >
                {{ !venueStore.currentVenue?.streamManuallyStarted ? "Starta" : "Avsluta" }} sändning
              </button>
            </div>
          </div>
          <div
            v-else
            class="flex-1"
          >
            Lobbyn öppnas automatiskt vid utsatt tid.
          </div>
        </div>
      </StepsItem>

      <!-- Event ends -->
      <StepsItem
        title="Manuellt avslut"
        icon="curtains_closed"
        tooltip="Ni avslutar sändningen manuellt."
      >
        <!-- <ol class="text-xs">
          <li>Ni avslutar sändningen <i>manuellt</i>.</li>
        </ol> -->
      </StepsItem>

      <!-- Event has ended -->
      <StepsItem
        icon="door_front"
        :last="true"
        tooltip="Eventet är avslutat."
      />
    </StepsContainer>

    <div class="divider" />
    <div class="flex items-stretch">
      <div class="flex-1">
        <AdminVenueSettings />
      </div>
      <div class="divider divider-horizontal" />
      <div class="flex-1">
        <AdminVenueLobby />
      </div>
      <div class="divider divider-horizontal" />
      <div class="flex-1">
        <AdminVenue360 />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import AdminVenueSettings from './components/AdminVenueSettings.vue';
import AdminVenueLobby from './components/AdminVenueLobby.vue';
import AdminVenue360 from './components/AdminVenue360.vue';
import { useConnectionStore } from '@/stores/connectionStore';
import StepsContainer from '@/components/design/StepsContainer.vue';
import StepsItem from '@/components/design/StepsItem.vue';
import { useAdminStore } from '@/stores/adminStore';

// Router
const router = useRouter();

// Stores
const connection = useConnectionStore();
const venueStore = useVenueStore();
const adminStore = useAdminStore();

async function updateDoors(open: boolean){
  await connection.client.admin.updateVenue.mutate({
    doorsManuallyOpened: open,
  });
}

async function updateStream(started: boolean){
  await connection.client.admin.updateVenue.mutate({
    streamManuallyStarted: started,
  });
}

onUnmounted(async () => {
  // if(venueStore.currentVenue){
  //   await venueStore.leaveVenue();
  //   router.push({name: 'adminHome'});
  // }
});

const deleteVenue = async () => {
  await adminStore.deleteCurrentVenue();
  router.push({name: 'adminHome'});
};

</script>

