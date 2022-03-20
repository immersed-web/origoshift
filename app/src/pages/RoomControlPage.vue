<template>
  <h5>Rumskontroll</h5>
  <QBtn
    @click="shareScreen"
    color="primary"
    no-caps
    label="Dela skärm"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import usePeerClient from 'src/composables/usePeerClient';
import { usePersistedStore } from 'src/stores/persistedStore';
import { useSoupStore } from 'src/stores/soupStore';

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();
const persistedStore = usePersistedStore();
// INITIALIZE!!!
(async () => {
  try {
    // First check if not yet connected to a gathering
    if (!soupStore.gatheringState) {
      // if not, try to connect using stores to choose gatheringName
      await peer.restoreOrInitializeGathering();
    }
    if (!persistedStore.roomName) {
      throw new Error('no persisted roomName to join. Bailing out maddafakka!');
    }
    const roomState = await peer.joinOrCreateRoom(persistedStore.roomName);
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
  screenStream.getTracks()[0].onended = () => {
    // TODO temporary solution. We should probably stop the correct producer instead of all of them
    peer.producers.forEach(producer => {
      producer.close();
    });
  };

  const producerId = await peer.produce(screenStream.getVideoTracks()[0], { screenShare: true });
  console.log('produce returned: ', producerId);
}

async function stopSharing () {
  console.log('stopSharing called');
}
</script>
