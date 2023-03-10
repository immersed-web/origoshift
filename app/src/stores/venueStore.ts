import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { ref } from 'vue';
import type { VenueId } from 'schemas';
import { clientOrThrow } from '@/modules/trpcClient';
// import { useConnectionStore } from '@/stores/connectionStore';

type Venue = RouterOutputs['venue']['joinVenue'];
export const useVenueStore = defineStore('venue', () => {
  console.log('VENUESTORE USE FUNCTION TRIGGERED');
  // const connection = useConnectionStore();
  const currentVenue = ref<Venue>();

  async function joinVenue (venueId: VenueId) {
    currentVenue.value = await clientOrThrow.value.venue.joinVenue.mutate({venueId});

  }
  async function leaveVenue() {
    await clientOrThrow.value.venue.leaveCurrentVenue.mutate();
    currentVenue.value = undefined;
  }

  // async function joinVenueAsSender(venueId: VenueId) {
  //   await clientOrThrow.value.venue.loadVenue.mutate({venueId});
  //   await clientOrThrow.value.venue.joinVenueAsSender.mutate({ venueId });
  //   currentVenueId.value = venueId;
  // }


  return {
    currentVenue,
    joinVenue,
    leaveVenue,
    // joinVenueAsSender,
  };
}, {
  persist: true,
});
