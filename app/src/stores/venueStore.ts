import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { ref, computed } from 'vue';
import type {} from 'database';
import type { VenueId } from 'schemas';
import { useConnectionStore } from '@/stores/connectionStore';

type _ReceivedVenueState = RouterOutputs['venue']['joinVenue'];
export const useVenueStore = defineStore('venue', () => {
  // console.log('VENUESTORE USE FUNCTION TRIGGERED');
  const connection = useConnectionStore();
  const currentVenue = ref<_ReceivedVenueState>();
  // const persistedVenueId = useLocalStorage<VenueId>('savedVenueId', null);
  const savedVenueId = ref<VenueId>();

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
    onError(err){
      console.error(err);
    },
  });
  connection.client.venue.subVenueUnloaded.subscribe(undefined, {
    onData() {
      currentVenue.value = undefined;
    },
    onError(err) {
      console.error(err);
    },
  });
  connection.client.venue.subVenueStateUpdated.subscribe(undefined, {
    onData(data){
      console.log('received venuestate updated:', data);
      currentVenue.value = data.data;
    },
    onError(err){
      console.error(err);
    },
  });

  const modelUrl = computed(() => {
    if(currentVenue.value?.vrSpace?.virtualSpace3DModel?.modelUrl.indexOf('https://') === 0){
      return currentVenue.value?.vrSpace?.virtualSpace3DModel?.modelUrl;
    }
    else {
      let path = `${import.meta.env.EXPOSED_FILESERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PORT}`;
      path += '/uploads/3d_models/';
      path += currentVenue.value?.vrSpace?.virtualSpace3DModel?.modelUrl;
      return path;
    }
  });

  const navmeshUrl = computed(() => {
    if(currentVenue.value?.vrSpace?.virtualSpace3DModel?.navmeshUrl === ''){
      return modelUrl.value;
    }
    else if(currentVenue.value?.vrSpace?.virtualSpace3DModel?.navmeshUrl.indexOf('https://') === 0){
      return currentVenue.value?.vrSpace?.virtualSpace3DModel?.navmeshUrl;
    }
    else {
      let path = `${import.meta.env.EXPOSED_FILESERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PORT}`;
      path += '/uploads/3d_models/';
      path += currentVenue.value?.vrSpace?.virtualSpace3DModel?.navmeshUrl;
      return path;
    }
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
    savedVenueId.value = currentVenue.value.venueId;
  }

  async function updateVenue () {
    await connection.client.admin.updateVenue.mutate({name: currentVenue.value?.name});
  }

  async function leaveVenue() {
    if(!currentVenue.value){
      console.warn('Tried to leave venue when you aren\'t in one.. Not so clever, eh?');
      return;
    }
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

  return {
    savedVenueId,
    currentVenue,
    createVenue,
    loadVenue,
    joinVenue,
    updateVenue,
    leaveVenue,
    deleteCurrentVenue,
    modelUrl,
    navmeshUrl,
  };
}, {
  persist: {
    paths: ['savedVenueId'],
  },
});
