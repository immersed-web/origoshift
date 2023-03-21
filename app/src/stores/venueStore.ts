import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { ref } from 'vue';
import type {} from 'database';
import type { VenueId } from 'schemas';
// import { clientOrThrow } from '@/modules/trpcClient';
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
  connection.client.admin.subVenueUnloaded.subscribe(undefined, {
    onData() {
      currentVenue.value = undefined;
    },
  });

  async function createVenue () {
    const venueId = await connection.client.admin.createNewVenue.mutate({name: `event-${Math.trunc(Math.random() * 1000)}`});
    await loadVenue(venueId);
    await joinVenue(venueId);
    console.log('Created, loaded and joined venue', venueId);
  }

  async function loadVenue (venueId: VenueId) {
    return await connection.client.admin.loadVenue.mutate({venueId});
  }

  async function joinVenue (venueId: VenueId) {
    currentVenue.value = await connection.client.venue.joinVenue.mutate({venueId});
  }

  async function updateVenue () {
    // const saveData = VenueUpdateSchema.parse(currentVenue.value);
    // await connection.client.venue.updateVenue.mutate(saveData);
    await connection.client.admin.updateVenue.mutate({name: currentVenue.value?.name});
  }

  async function leaveVenue() {
    await connection.client.venue.leaveCurrentVenue.mutate();
    currentVenue.value = undefined;
  }

  async function deleteCurrentVenue() {

    if(currentVenue.value?.venueId){
      const venueId = currentVenue.value.venueId;
      await leaveVenue();
      // TODO: Make all other clients leave venue, too
      await connection.client.admin.deleteVenue.mutate({venueId});
    }
  }

  // async function joinVenueAsSender(venueId: VenueId) {
  //   await clientOrThrow.value.venue.loadVenue.mutate({venueId});
  //   await clientOrThrow.value.venue.joinVenueAsSender.mutate({ venueId });
  //   currentVenueId.value = venueId;
  // }


  return {
    currentVenue,
    createVenue,
    loadVenue,
    joinVenue,
    updateVenue,
    leaveVenue,
    deleteCurrentVenue,
    // joinVenueAsSender,
  };
});
