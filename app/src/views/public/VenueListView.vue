<template>
  <div class="flex flex-col gap-4 mb-12 items-start">
    <div class="flex items-center">
      <h2>
        Välkommen&nbsp; 
      </h2>
      <div class="flex gap-2 items-center" v-if="!isEditingUsername" >
        <h2 class="inline">
          <span class="underline decoration-dashed decoration-accent">
          {{ authStore.username }}!
          </span>
        </h2>
        <button @click="isEditingUsername = true" class="btn btn-sm btn-square">
          <span class="material-icons">edit</span>
        </button>
      </div>
      <div class="flex gap-2 items-center" v-else>
        <input v-model="username" class="input input-bordered input-sm">
        <button @click="updateUsername" class="btn btn-primary btn-square btn-sm"><span class="material-icons">save</span></button>
        <button @click="isEditingUsername = false" class="btn btn-error btn-square btn-sm"><span class="material-icons">cancel</span></button>
      </div>
      <RouterLink :to="{name: 'adminHome'}">
        <button
          v-if="authStore.role && hasAtLeastSecurityLevel(authStore.role, 'admin')"
          class="btn btn-sm btn-outline btn-primary"
        >
          Admininställningar
          <span class="material-icons">arrow_right</span>
        </button>
      </RouterLink>
    </div>
    <div
      v-if="venuesOngoing.length"
      class="space-y-2"
    >
      <h3 class="text-base-content/90">
        Pågående event
      </h3>
      <VenueList
        :venues="venuesOngoing"
        @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
      />
    </div>

    <div
      v-if="venuesUpcoming.length"
    >
      <h3 class="text-base-content/90">
        Kommande event
      </h3>
      <VenueList
        :venues="venuesUpcoming"
        @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
      />
    </div>
    <!-- <h1>Tidigare event</h1>
    <VenueList
      v-if="venuesPast.length"
      :venues="venuesPast"
      @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
    />
    <div v-else>
      <p>
        Inga tidigare event
      </p>
    </div> -->


    <div
      v-if="venuesUnscheduled.length"
    >
      <h3 class="text-base-content/90">
        Event utan datum
      </h3>
      <VenueList
        :venues="venuesUnscheduled"
        @venue-picked="(venue) => goToVenue(venue.venueId as VenueId)"
      />
    </div>
  </div>

  <!-- <pre>
    ALLOWED:
    {{ receivedVenues }}
  </pre> -->

  <!-- <pre>
    LOADED:
    {{ venuesLoaded }}
  </pre>

  <pre>
    ONGOING:
    {{ venuesOngoing }}
  </pre>

  <pre>
    NOT ONGOING:
    {{ venuesNotOngoing }}
  </pre> -->
</template>

<script setup lang="ts">

import type { RouterOutputs } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';
import { computed, onBeforeMount, ref } from 'vue';
import VenueList from '@/components/venue/VenueList.vue';
import { type VenueId, hasAtLeastSecurityLevel } from 'schemas/esm';
import { useRouter } from 'vue-router';
import { isPast } from 'date-fns';
import { venueConsideredActive } from '@/stores/venueStore';
import { useAuthStore } from '@/stores/authStore';


const authStore = useAuthStore();
const username = ref(authStore.username);
const isEditingUsername = ref(false);

const router = useRouter();
const venuesAllowed = ref<RouterOutputs['venue']['listAllowedVenues']>([]);
// const venuesLoaded = ref<RouterOutputs['venue']['listLoadedVenuesPublicState']>();

const connection = useConnectionStore();
onBeforeMount(async () =>{
  venuesAllowed.value = await connection.client.venue.listAllowedVenues.query();
  // venuesLoaded.value = await connection.client.venue.listLoadedVenuesPublicState.query();
});

const venuesOngoing = computed(() => {
  // return venuesAllowed.value.filter(v => venuesLoaded.value && v.venueId in venuesLoaded.value);
  return venuesAllowed.value.filter(v => {
    return venueConsideredActive(v);
  });
});

const venuesNotOngoing = computed(() => {
  return venuesAllowed.value.filter(v => !venuesOngoing.value.includes(v));
});

const venuesUpcoming = computed(() => {
  return venuesNotOngoing.value.filter(v => v.streamStartTime && !isPast(v.streamStartTime));
});

const venuesPast = computed(() => {
  return venuesNotOngoing.value.filter(v => v.streamStartTime && isPast(v.streamStartTime));
});

const venuesUnscheduled = computed(() => {
  return venuesNotOngoing.value.filter(v => !v.streamStartTime);
});

async function goToVenue(venueId: VenueId){
  // await venueStore.joinVenue(venueId);
  router.push({name: 'userVenue', params: { venueId }});
}

async function updateUsername() {
  await authStore.logout()
  await authStore.autoGuest(username.value);
  isEditingUsername.value = false;
}

</script>
