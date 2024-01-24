import { defineStore } from 'pinia';
import type { RouterOutputs } from '@/modules/trpcClient';
import { ref, computed, type Ref } from 'vue';
import type { Visibility } from 'database';
import type { VenueId } from 'schemas';
import { useConnectionStore } from '@/stores/connectionStore';
import { useNow } from '@vueuse/core';

type _ReceivedPublicVenueState = RouterOutputs['venue']['joinVenue'];

export type VisibilityDetails = {
  visibility: Visibility,
  name: string,
  icon: string,
  description: string
}

export const useVenueStore = defineStore('venue', () => {
  // console.log('VENUESTORE USE FUNCTION TRIGGERED');
  const now = useNow({interval: 1000});
  const connection = useConnectionStore();
  // const authStore = useAuthStore();

  const currentVenue = ref<_ReceivedPublicVenueState>();
  const savedVenueId = ref<VenueId>();


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

  const urlToFileserver = `https://${import.meta.env.EXPOSED_SERVER_URL}${import.meta.env.EXPOSED_FILESERVER_PATH}`;
  const urlToModelsFolder = urlToFileserver + '/uploads/3d_models/';
  const modelUrl = computed(() => {
    if(!currentVenue.value?.vrSpace?.virtualSpace3DModel?.modelFileFormat){
      return undefined;
    }
    const modelId = currentVenue.value.vrSpace.virtualSpace3DModelId;
    const extension = currentVenue.value.vrSpace.virtualSpace3DModel.modelFileFormat;
    return urlToModelsFolder + modelId + '.model.' + extension;
  });
  const navmeshUrl = computed(() => {
    if(!currentVenue.value?.vrSpace?.virtualSpace3DModel?.navmeshFileFormat){
      return undefined;
    }
    const modelId = currentVenue.value.vrSpace.virtualSpace3DModelId;
    const extension = currentVenue.value.vrSpace.virtualSpace3DModel.navmeshFileFormat;
    return urlToModelsFolder + modelId + '.navmesh.' + extension;
  });

  async function loadAndJoinVenue (venueId: VenueId) {
    currentVenue.value = await connection.client.venue.loadAndJoinVenue.mutate({venueId});
    savedVenueId.value = currentVenue.value.venueId;
  }

  async function joinVenue (venueId: VenueId) {
    currentVenue.value = await connection.client.venue.joinVenue.mutate({venueId});
    savedVenueId.value = currentVenue.value.venueId;
  }

  async function leaveVenue() {
    if(!currentVenue.value){
      console.warn('Tried to leave venue when you aren\'t in one.. Not so clever, eh?');
      return;
    }
    await connection.client.venue.leaveCurrentVenue.mutate();
    currentVenue.value = undefined;
  }


  const visibilityOptions : Ref<VisibilityDetails[]> = ref([
    {
      visibility: 'private',
      name: 'Privat',
      icon: 'lock',
      description: 'Endast du kan se detta event.',
    },
    {
      visibility: 'unlisted',
      name: 'Länk',
      icon: 'link',
      description: 'Alla med länken kan se och delta i eventet.',
    },
    {
      visibility: 'public',
      name: 'Publik',
      icon: 'list',
      description: 'Eventet listas öppet på webbplatsen.',
    },
  ] as VisibilityDetails[]);

  const currentVisibilityDetails = computed(() => {
    return visibilityOptions.value.find(o => o.visibility === currentVenue.value?.visibility);
  });
  
  // TODO: We can potentially get a bit weird behaviour were the timeOffset jumps on reload.
  // This would for example mean that the countdown reaches 0, the user enters VR. But then going back and reloading could give countdown.
  // For now we mitigate it somewhat by setting the offset when loading this store, persisting it as long as user dosnt refresh browser.
  const timeSpread = 30;
  let timeOffset = 0;
  timeOffset = Math.random() * timeSpread;
  const secondsUntilDoorsOpen = computed(() => {
    if(!currentVenue.value?.vrSpace || !currentVenue.value?.doorsAutoOpen || !currentVenue.value.doorsOpeningTime) return undefined;
    const millis = currentVenue.value.doorsOpeningTime.getTime() - now.value.getTime();
    return Math.trunc(Math.max(0, millis*0.001 + timeOffset));
  });
  
  const doorsAreOpen = computed(() => {
    if(!currentVenue.value) return false;
    if(secondsUntilDoorsOpen.value !== undefined){
      return secondsUntilDoorsOpen.value === 0;
    }
    else return currentVenue.value.doorsManuallyOpened;
  });
  
  const streamIsActive = computed(() => {
    if(!currentVenue.value || currentVenue.value.streamManuallyEnded) return false;
    if(currentVenue.value.streamAutoStart && currentVenue.value.streamStartTime){
      const isPast = currentVenue.value.streamStartTime.getTime() < now.value.getTime();
      return isPast;
    }
    else {
      return currentVenue.value.streamManuallyStarted;
    }
  });

  return {
    doorsAreOpen,
    secondsUntilDoorsOpen,
    streamIsActive,
    savedVenueId,
    currentVenue,
    loadAndJoinVenue,
    joinVenue,
    leaveVenue,
    modelUrl,
    navmeshUrl,
    visibilityOptions,
    currentVisibilityDetails,
  };
}, {
  persist: {
    paths: ['savedVenueId'],
  },
});
