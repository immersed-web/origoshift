import type { SubscriptionValue, RouterOutputs } from '@/modules/trpcClient';
import { defineStore } from 'pinia';
import type { CameraId, SenderId, VenueId, Visibility, CameraPortalUpdate, CameraViewOriginUpdate, ConnectionId, CameraType, CameraUpdate } from 'schemas';
import { ref } from 'vue';
import { useConnectionStore } from './connectionStore';
import { useVenueStore } from './venueStore';

type _ReceivedAdminVenueState = SubscriptionValue<RouterOutputs['admin']['subVenueStateUpdated']>['data'];
export const useAdminStore = defineStore('admin', () => {
  const venueStore = useVenueStore();
  const connection = useConnectionStore();

  const adminOnlyVenueState = ref<_ReceivedAdminVenueState>();

  // Refs
  // type ReceivedSenderData = SubscriptionValue<RouterOutputs['admin']['subSenderAddedOrRemoved']>['data']['senderState'];

  // TODO: Do we really want deep reactive object?
  // const connectedSenders = reactive<Map<ReceivedSenderData['connectionId'], ReceivedSenderData>>(new Map());

  // if(venueStore.currentVenue){

  //   connectedSenders. venueStore.currentVenue.senders
  // }


  connection.client.admin.subVenueStateUpdated.subscribe(undefined, {
    onData({data, reason}){
      console.log('venueState (adminonly) updated:', { data, reason});
      adminOnlyVenueState.value = data;
    },
  });

  // connectionStore.client.admin.subSenderAddedOrRemoved.subscribe(undefined, {
  //   onData({data, reason}) {
  //     console.log('senderAddedOrRemoved triggered!:', data, reason);
  //     const client = data.senderState;
  //     if(data.added){
  //       connectedSenders.set(client.connectionId ,client);
  //     } else {
  //       connectedSenders.delete(client.connectionId);
  //     }
  //   },
  // });

  // connectionStore.client.admin.subProducerCreated.subscribe(undefined, {
  //   onData(data) {
  //     console.log('received new producer:', data);
  //     const { producingConnectionId, producer } = data;
  //     const sender = connectedSenders.get(producingConnectionId);
  //     if(!sender) {
  //       console.warn('The created producer wasnt in the list of connected senders. Perhaps a normal user?');
  //       return;
  //     }
  //     sender.producers[producer.producerId] = producer;
  //     connectedSenders.set(producingConnectionId, sender);
  //   },
  // });

  async function createVenue () {
    const venueId = await connection.client.admin.createNewVenue.mutate({name: `event-${Math.trunc(Math.random() * 1000)}`});
    loadAndJoinVenueAsAdmin(venueId);
    console.log('Created, loaded and joined venue', venueId);
  }

  // TODO: Shouldn't have to redefine VenueUpdate type
  // async function updateVenue (name?: string, visibility?: Visibility, doorsOpeningTime?: Date | null, doorsAutoOpen?: boolean, streamStartTime?: Date | null) {
  //   await connection.client.admin.updateVenue.mutate({
  //     name: name,
  //     visibility: visibility,
  //     doorsOpeningTime: doorsOpeningTime,
  //     doorsAutoOpen: doorsAutoOpen,
  //     streamStartTime: streamStartTime,
  //   });
  // }

  async function deleteCurrentVenue() {
    if(venueStore.currentVenue?.venueId){
      const venueId = venueStore.currentVenue.venueId;
      await venueStore.leaveVenue();
      // TODO: Make all other clients leave venue, too
      await connection.client.admin.deleteVenue.mutate({venueId});
    }
  }

  // async function loadVenue (venueId: VenueId) {
  //   return await connection.client.admin.loadVenue.mutate({venueId});
  // }

  async function loadAndJoinVenueAsAdmin ( venueId: VenueId) {
    const {publicVenueState, adminOnlyVenueState: aOnlyState} = await connection.client.admin.loadAndJoinVenue.mutate({venueId});
    venueStore.currentVenue = publicVenueState;
    adminOnlyVenueState.value = aOnlyState;
  }
  
  async function updateCamera(cameraId: CameraId, input: CameraUpdate['update']){
    await connection.client.admin.updateCamera.mutate({cameraId, update: input});
  }

  async function createCameraFromSender(cameraName: string, senderId: SenderId){
    await connection.client.admin.createCamera.mutate({name: cameraName, senderId});
  }
  
  async function setSenderForCamera(cameraId: CameraId, senderId: SenderId) {
    await connection.client.admin.setSenderForCamera.mutate({cameraId, senderId});
  }
  
  async function setCameraName(cameraId: CameraId, newName: string) {
    await connection.client.admin.setCameraName.mutate({cameraId, newName});
  }

  async function setCameraType(cameraId: CameraId, cameraType: CameraType) {
    await connection.client.admin.setCameraType.mutate({cameraId, cameraType});
  }
  
  async function setCameraViewOrigin(data: CameraViewOriginUpdate){
    await connection.client.admin.setCameraViewOrigin.mutate(data);
  }
  
  async function setPortal(data: CameraPortalUpdate) {
    await connection.client.admin.setCameraPortal.mutate(data);
  }
  
  async function deletePortal(fromCameraId:CameraId, toCameraId: CameraId) {
    await connection.client.admin.deleteCameraPortal.mutate({
      fromCameraId,
      toCameraId,
    });
  }

  async function deleteCamera(cameraId: CameraId){
    await connection.client.admin.deleteCamera.mutate({cameraId});
  }


  return {
    adminOnlyVenueState,
    createVenue,
    // updateVenue,
    // loadVenue,
    loadAndJoinVenueAsAdmin,
    deleteCurrentVenue,
    createCameraFromSender,
    setSenderForCamera,
    updateCamera,
    setCameraName,
    setCameraType,
    setPortal,
    deletePortal,
    setCameraViewOrigin,
    deleteCamera,
  };
});
