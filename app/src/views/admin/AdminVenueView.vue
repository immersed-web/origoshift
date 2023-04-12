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
        :title="'Synlighet: ' + venueStore.currentVisibilityDetails?.name"
        :icon="venueStore.currentVisibilityDetails?.icon"
        :tooltip="venueStore.currentVisibilityDetails?.description"
      >
        <!-- {{ venueStore.currentVisibilityDetails?.description }} -->
      </StepsItem>

      <!-- Doors open -->
      <StepsItem
        v-if="venueStore.currentVenue?.doorsOpeningTime"
        :title="venueStore.currentVenue?.doorsOpeningTime?.toLocaleString()"
        icon="meeting_room"
        tooltip="Dörrarna till eventet öppnas automatiskt den angivna tiden. Om eventet har en VR-lobby har besökaren möjlighet att gå in i denna."
      />
      <StepsItem
        v-else
        title="Manuell dörröppning"
        icon="meeting_room"
        tooltip="Ni öppnar manuellt dörrarna när ni önskar. Om eventet har en VR-lobby har besökaren möjlighet att gå in i denna."
      >
        <label class="cursor-pointer label flex justify-start gap-2">
          <span>Öppen dörr:</span>
          <input
            class="mr-2 toggle toggle-primary toggle-sm"
            type="checkbox"
            v-model="doorToggle"
          >
          <!-- <span class="label-text">{{ doorToggle? 'Dörrar är nu öppna' : 'Dörrar är nu stängda' }}</span> -->
        </label>
      </StepsItem>

      <!-- Streaming starts -->
      <StepsItem
        :title="venueStore.currentVenue?.streamStartTime?.toLocaleString()"
        icon="curtains"
        tooltip="360-sändningens planerade starttid, synlig för besökarna. Ni startar sändningen manuellt när ni är redo, varpå samtliga besökare automatiskt slussas in."
      >
        <!-- <ol class="text-xs">
          <li>360-sändningens <i>planerade</i> starttid, synlig för besökarna.</li>
          <li>Ni startar sändningen <i>manuellt</i> när ni är redo.</li>
        </ol> -->
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

const doorToggle = ref<boolean>(false);
watch(doorToggle, async (doorState) => {
  await updateDoors(doorState);
});
async function updateDoors(open: boolean){
  if(open){
    await connection.client.admin.openVenueDoors.mutate();
  } else {
    await connection.client.admin.closeVenueDoors.mutate();
  }
  console.log(open);
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

