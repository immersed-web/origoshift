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
    <StepsContainer>
      <!-- Visibility -->
      <StepsItem
        :title="'Synlighet: ' + venueStore.currentVisibilityDetails?.name"
        :icon="venueStore.currentVisibilityDetails?.icon"
      >
        {{ venueStore.currentVisibilityDetails?.description }}
      </StepsItem>

      <!-- Doors open -->
      <StepsItem
        :title="venueStore.currentVenue?.doorsOpeningTime?.toLocaleString()"
        icon="meeting_room"
      >
        <ol class="text-xs">
          <li>Dörrarna till eventet öppnas <i>automatiskt</i> den angivna tiden.</li>
          <li>Om eventet har en VR-lobby har besökaren möjlighet att gå in i denna.</li>
          <li>Samtliga besökare slussas automatiskt vidare till 360-sändningen när eventet startar.</li>
        </ol>
      </StepsItem>

      <!-- Streaming starts -->
      <StepsItem
        :title="venueStore.currentVenue?.streamStartTime?.toLocaleString()"
        icon="curtains"
      >
        <ol class="text-xs">
          <li>360-sändningens <i>planerade</i> starttid, synlig för besökarna.</li>
          <li>Ni startar sändningen <i>manuellt</i> när ni är redo.</li>
        </ol>
      </StepsItem>

      <!-- Event ends -->
      <StepsItem
        title="Manuellt avslut"
        icon="curtains_closed"
      >
        <ol class="text-xs">
          <li>Ni avslutar sändningen <i>manuellt</i>.</li>
        </ol>
      </StepsItem>

      <!-- Event has ended -->
      <StepsItem
        icon="door_front"
        :last="true"
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
import { useRouter } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import AdminVenueSettings from './components/AdminVenueSettings.vue';
import AdminVenueLobby from './components/AdminVenueLobby.vue';
import AdminVenue360 from './components/AdminVenue360.vue';
import StepsContainer from '@/components/design/StepsContainer.vue';
import StepsItem from '@/components/design/StepsItem.vue';

// Router
const router = useRouter();

// Stores
const venueStore = useVenueStore();

const deleteVenue = async () => {
  await venueStore.deleteCurrentVenue();
  router.push({name: 'adminHome'});
};

</script>

