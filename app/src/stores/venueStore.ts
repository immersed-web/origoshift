import { defineStore } from 'pinia';
// import type { RouterOutputs } from '@/modules/trpcClient';
import { ref } from 'vue';
// import type { Venue } from 'database';
import type { VenueId } from 'schemas';
import { clientOrThrow } from '@/modules/trpcClient';
// import { useConnectionStore } from '@/stores/connectionStore';

// type Venue = Simplify<RouterOutputs['venue']['listAllowedVenues'][number]>
export const useVenueStore = defineStore('venue', () => {
  console.log('VENUESTORE USE FUNCTION TRIGGERED');
  // const connection = useConnectionStore();
  const currentVenueId = ref<VenueId>();

  // if(currentVenueId.value) {
  //   console.log('venueStore loaded with saved venueId. Will try to join!');
  //   if(connection.connectionType === 'client'){
  //     await joinVenue(currentVenueId.value);
  //   } else if (connection.connectionType === 'sender'){
  //     await joinVenueAsSender(currentVenueId.value);
  //   }
  // }

  async function joinVenue (venueId: VenueId) {
    await clientOrThrow.value.venue.joinVenue.mutate({venueId});
    currentVenueId.value = venueId;
  }
  async function leaveVenue() {
    await clientOrThrow.value.venue.leaveCurrentVenue.mutate();
    currentVenueId.value = undefined;
  }

  // async function joinVenueAsSender(venueId: VenueId) {
  //   await clientOrThrow.value.venue.loadVenue.mutate({venueId});
  //   await clientOrThrow.value.venue.joinVenueAsSender.mutate({ venueId });
  //   currentVenueId.value = venueId;
  // }


  return {
    currentVenueId,
    joinVenue,
    leaveVenue,
    // joinVenueAsSender,
  };
}, {
  persist: true,
});
