import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { ref } from 'vue';
import type { VenueId } from 'schemas';
import { clientOrThrow } from '@/modules/trpcClient';
import { useConnectionStore } from '@/stores/connectionStore';

type Venue = RouterOutputs['venue']['joinVenue'];
export const useVenueStore = defineStore('venue', () => {
  console.log('VENUESTORE USE FUNCTION TRIGGERED');
  const connection = useConnectionStore();
  const currentVenue = ref<Venue>();

  connection.client.venue.subClientAddedOrRemoved.subscribe(undefined, {
    onData(data){
      if(data.added){
        currentVenue.value?.clientIds.push(data.client.connectionId);
      } else {
        const idx = currentVenue.value?.clientIds.indexOf(data.client.connectionId);
        if(idx !== undefined){
          currentVenue.value?.clientIds.splice(idx, 1);
        }
      }
    },
  });
  connection.client.venue.subVenueUnloaded.subscribe(undefined, {
    onData() {
      currentVenue.value = undefined;
    },
  });

  async function loadVenue (venueId: VenueId) {
    return await clientOrThrow.value.venue.loadVenue.mutate({venueId: venueId});
  }
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
    loadVenue,
    joinVenue,
    leaveVenue,
    // joinVenueAsSender,
  };
});
