<template>
  <div class="q-ml-md q-mt-md row no-wrap items-center">
    <QBtn
      :to="{name: 'controlLobby', }"
      round
      icon="arrow_back"
      color="primary"
      class=""
    />
    <div class="text-h3 q-ml-md">
      Rumskontroll
    </div>
  </div>
  <div class="q-ma-md">
    <h5>rumsnamn: {{ soupStore.roomState?.roomName }}</h5>
    <ClientList
      id="client-list"
      v-if="soupStore.roomState && soupStore.roomState.clients && soupStore.clientId"
      :client-id="soupStore.clientId"
      :clients="soupStore.roomState.clients"
      @client-removed="kickClient"
    />
    <QBtn
      class="q-mt-md"
      @click="shareScreen"
      color="primary"
      label="Dela skärm"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import usePeerClient from 'src/composables/usePeerClient';
// import { usePersistedStore } from 'src/stores/persistedStore';
import { useSoupStore } from 'src/stores/soupStore';
import ClientList from 'src/components/ClientList.vue';
import { ProducerInfo } from 'shared-types/CustomTypes';

const router = useRouter();
const route = useRoute();
const peer = usePeerClient();
const soupStore = useSoupStore();
// const persistedStore = usePersistedStore();

function kickClient (clientId: string) {
  if (!soupStore.roomId) {
    throw Error('tried to kick client when not in a room');
  }
  peer.removeClientFromRoom(clientId, soupStore.roomId);
}
// INITIALIZE!!!
(async () => {
  try {
    // First check if not yet connected to a gathering
    if (!soupStore.gatheringState) {
      // if not, try to connect using stores to choose gatheringName
      await peer.restoreOrInitializeGathering();
    }
    // if (!persistedStore.roomName) {
    //   throw new Error('no persisted roomName to join. Bailing out maddafakka!');
    // }
    // const roomState = await peer.joinOrCreateRoom(persistedStore.roomName);
    if (!route.params.roomId || Array.isArray(route.params.roomId)) {
      throw new Error('no or incorrectly formatted roomId specified in route!');
    }
    const roomId = route.params.roomId;
    const roomState = await peer.joinRoom(roomId);
    soupStore.setRoomState(roomState);

    await peer.sendRtpCapabilities();
    await peer.createSendTransport();
  } catch (e) {
    console.error(e);
    router.replace('/login');
  }
})();

let screenStream: MediaStream;
async function shareScreen () {
  const stream = await navigator.mediaDevices.getDisplayMedia();
  screenStream = stream;

  const videoTrack = screenStream.getVideoTracks()[0];
  const producerInfo: ProducerInfo = { screenShare: true };

  // NOTE: This doesnt work since browser always reports screen size regardless of the tracks actual dimensions :-(
  // const settings = videoTrack.getSettings();
  // const { width, height } = settings;
  // if (width && height) {
  //   producerInfo.dimensions = { w: width, h: height };
  // }
  const producerId = await peer.produce(videoTrack, producerInfo);
  console.log('produce returned: ', producerId);

  videoTrack.onended = () => {
    console.log('gonna close producer!!');
    peer.closeAndNotifyProducer(producerId);
  };
}

</script>

<style scoped lang="scss">

#client-list {
  max-width: 40rem;
}
</style>
