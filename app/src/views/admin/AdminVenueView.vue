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
        <div v-auto-animate>
          <button
            v-if="venueStore.currentVenue?.visibility !== 'private' "
            class="btn btn-primary btn-sm flex justify-between"
            @click="goToVenue()"
          >
            Eventets webbplats
            <span class="ml-2 material-icons">open_in_new</span>
          </button>
        </div>
      </StepsItem>

      <!-- Lobby -->
      <StepsItem
        icon="nightlife"
      >
        <template #title>
          <span
            class="material-icons text-sm"
            :class="venueStore.doorsAreOpen ? 'text-green-500' : 'text-red-500'"
          >circle</span>
          Lobbyn är {{ venueStore.doorsAreOpen ? 'öppen' : 'stängd' }}
        </template>
        <div v-auto-animate>
          <div v-if="venueStore.currentVenue?.doorsOpeningTime">
            <span>Listad öppningstid: </span>
            <strong> {{ venueStore.currentVenue?.doorsOpeningTime?.toLocaleString() }}</strong>
          </div>
        </div>
        <div v-auto-animate>
          <div v-if="!venueStore.currentVenue?.doorsAutoOpen">
            <div>
              {{ venueStore.currentVenue?.doorsOpeningTime ? 'Ni öppnar lobbyn manuellt vid utsatt tid.' : 'Om ni önskar, kan ni öppna lobbyn manuellt' }}
            </div>
            <div class="">
              <button
                class="btn btn-sm"
                :class="!venueStore.doorsAreOpen ? 'btn-primary' : 'btn-error'"
                @click="updateDoors(!venueStore.currentVenue?.doorsManuallyOpened)"
              >
                {{ !venueStore.currentVenue?.doorsManuallyOpened ? "Öppna" : "Stäng" }} lobbyn
              </button>
            </div>
          </div>
          <div v-else>
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
            :class="venueStore.currentVenue?.streamIsActive ? 'text-green-500' : 'text-red-500'"
          >circle</span>
          Sändningen är {{ venueStore.currentVenue?.streamIsActive ? 'igång' : 'ej igång' }}
        </template>
        <div v-auto-animate>
          <div v-if="venueStore.currentVenue?.streamStartTime">
            <span>Listad starttid: </span>
            <strong> {{ venueStore.currentVenue?.streamStartTime?.toLocaleString() }}</strong>
          </div>
        </div>
        <div v-auto-animate>
          <div v-if="!venueStore.currentVenue?.streamAutoStart">
            <div>
              {{ venueStore.currentVenue?.streamStartTime ? 'Ni startar sändningen manuellt vid utsatt tid.' : 'Om ni önskar, kan ni starta sändningen manuellt' }}
            </div>
            <div>
              <button
                class="btn btn-primary btn-sm"
                @click="startStream"
                :disabled="!!venueStore.currentVenue?.streamIsActive"
              >
                Starta sändning
              </button>
            </div>
          </div>
          <div
            v-else
            class="flex-1"
          >
            Sändningen startar automatiskt vid utsatt tid.
          </div>
        </div>
      </StepsItem>

      <!-- Event ends -->
      <StepsItem
        title="Manuellt avslut"
        icon="curtains_closed"
      >
        <template #title>
          Avsluta sändning
        </template>
        <div class="flex-1">
          Ni avslutar sändningen manuellt när ni önskar.
        </div>
        <div
          class=""
        >
          <button
            class="btn btn-error btn-sm"
            @click="endStream"
            :disabled="!venueStore.currentVenue?.streamIsActive"
          >
            Avsluta sändning
          </button>
        </div>
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
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import AdminVenueSettings from './components/AdminVenueSettings.vue';
import AdminVenueLobby from './components/AdminVenueLobby.vue';
import AdminVenue360 from './components/AdminVenue360.vue';
import { useConnectionStore } from '@/stores/connectionStore';
import StepsContainer from '@/components/design/StepsContainer.vue';
import StepsItem from '@/components/design/StepsItem.vue';
import { useAdminStore } from '@/stores/adminStore';
import { useClientStore } from '@/stores/clientStore';

// Router
const router = useRouter();

// Stores
const connection = useConnectionStore();
const venueStore = useVenueStore();
const adminStore = useAdminStore();
const clientStore = useClientStore();

async function updateDoors(open: boolean){
  await connection.client.admin.updateVenue.mutate({
    doorsManuallyOpened: open,
  });
}

async function startStream(){
  await connection.client.admin.updateVenue.mutate({
    streamManuallyStarted: true,
    streamManuallyEnded: false,
  });
}

async function endStream(){
  await connection.client.admin.updateVenue.mutate({
    streamManuallyStarted: false,
    streamManuallyEnded: true,
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
  // TODO: quick hack to make sure venuelist is updated...
  await clientStore.fetchClientState();
  router.push({name: 'adminHome'});
};

async function goToVenue(){
  // await venueStore.joinVenue(venueId);
  const id = venueStore.currentVenue?.venueId;
  const routeData = router.resolve({name: 'userVenue', params: { venueId: id }});
  window.open(routeData.href, '_blank');
}

</script>

