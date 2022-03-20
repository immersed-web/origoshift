<template>
  <QCard
    tag="div"
    id="overlay"
    class="q-pa-md"
  >
    <QList>
      <QItemLabel header>
        I detta rum:
      </QItemLabel>
      <QItem
        v-for="client in soupStore.roomState?.clients"
        :key="client.clientId"
      >
        {{ client.username }}
        <template v-if="client.clientId === soupStore.clientState?.clientId">
          (du)
        </template>
      </QItem>
    </QList>
    <QBtn
      icon="waving_hand"
      color="primary"
      text-color="yellow"
      round
      @click="raiseHand"
    />
    <QBtn
      label="update video-sphere"
      @click="initVideoSphere"
    />
  </QCard>
  <div
    id="main-container"
    class="row justify-between no-wrap items-center content-center"
  >
    <!-- <QBtn
      class="q-ma-md"
      icon="keyboard_arrow_left"
      round
      color="primary"
      @click="prevRoom()"
    /> -->
    <video
      v-show="true"
      id="main-video"
      class="col"
      autoplay
      ref="videoTag"
    />
    <a-scene embedded>
      <a-camera
        look-controls-enabled
        reverse-mouse-drag="true"
        wasd-controls-enabled="false"
      />
      <a-videosphere />
      <a-video
        width="16"
        height="9"
        position="0 0 -20"
      />
    </a-scene>
    <!-- <QBtn
      class="q-ma-md"
      round
      icon="keyboard_arrow_right"
      color="primary"
      @click="nextRoom()"
    /> -->
  </div>
  <!-- <QList>
      <QItem
        v-for="producerInfo in producers"
        :key="producerInfo.producerId"
      >
        <QBtn
          :label="producerInfo.producerId"
          @click="consume(producerInfo)"
        />
      </QItem>
    </QList> -->
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
// import { useUserStore } from 'src/stores/userStore';
import usePeerClient from 'src/composables/usePeerClient';
import { useRouter } from 'vue-router';
import 'aframe';
import { usePersistedStore } from 'src/stores/persistedStore';
import { useUserStore } from 'src/stores/userStore';

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();
const userStore = useUserStore();
const persistedStore = usePersistedStore();

// soupStore.$onAction(({ name, after, onError, store }) => {
//   if (name === 'setRoomState') {
//     after(() => {
//       console.log('roomStateUpdated!!!');

//       // if (!store.roomState?.mainProducer) return;
//       // consume(store.roomState.mainProducer);
//     });

//     onError(error => {
//       console.error(error);
//       router.back();
//     });
//   }
// });

soupStore.$subscribe((mutation, state) => {
  if (!state.connected) {
    router.replace('/join');
  }
});

const videoTag = ref<HTMLVideoElement>();

async function raiseHand () {
  await peer.setCustomProperties({
    handRaised: true,
  });
}

async function consume (producerId: string) {
  // await peer.joinRoom(producerInfo.roomId);
  if (!videoTag.value) return;
  const { track } = await peer.consume(producerId);
  videoTag.value.srcObject = new MediaStream([track]);
  await nextTick();
  initVideoSphere();
}
// initVideoSphere();

//
// ***************
// INITIALIZE
(async () => {
  const route = router.currentRoute.value;

  try {
    await peer.connect(userStore.jwt);
    // First check if not yet connected to a gathering
    if (!soupStore.gatheringState) {
      // if not. connect to one, starting by checking if available in userdata, and then check persistedStore. If no gatheringName found, pick one from dialog.
      let gatheringName: string;
      if (userStore.userData?.gathering) {
        gatheringName = userStore.userData.gathering;
      } else if (persistedStore.gatheringName) {
        gatheringName = persistedStore.gatheringName;
      }
      if (!gatheringName) {
        // TODO: Maybe show dialog to choose gathering?
        throw new Error('no gathering set. cant join room and gathering without specifying gathering!');
      }

      const gatheringId = await peer.findGathering(gatheringName);
      const gState = await peer.joinGathering(gatheringId);
      soupStore.setGatheringState(gState);
      await peer.getRouterCapabilities();
      await peer.loadMediasoupDevice();
    }

    // if success joining gathering, join the room defined by the route!
    if (!route.params.roomId || Array.isArray(route.params.roomId)) {
      throw new Error('no or incorrectly formatted roomId specified in route!');
    }
    await peer.createReceiveTransport();
    await peer.sendRtpCapabilities();

    const roomState = await peer.joinRoom(route.params.roomId);
    soupStore.setRoomState(roomState);
  } catch (e) {
    console.error(e);
    router.back();
  }

  // Now we should be ready to start consuming media!!!

  // if (rooms.value.length) {
  //   await consume(rooms.value[currentRoomIndex]);
  // }
})();

async function initVideoSphere () {
  // const sceneEl = document.querySelector('a-scene');
  // TODO: Check whether we need to remove and insert new sphere, or if it's enough to update src of existing one.
  // const prevVSphere = sceneEl.querySelector('a-videosphere');
  // if (prevVSphere) {
  //   prevVSphere.remove();
  // }
  // const vSphere = document.createElement('a-videosphere');
  const vSphere = document.querySelector('a-videosphere');
  if (!vSphere) throw new Error('no videosphere found in DOM!!! What have you done Gunnar??');
  // vSphere.setAttribute('srcObject', 'https://bitmovin.com/player-content/playhouse-vr/progressive.mp4');
  vSphere.setAttribute('src', '#main-video');
  const vVideo = document.querySelector('a-video');
  if (!vVideo) throw new Error('no videoframe found in (a-frame) DOM!!! What have you done Gunnar??');
  vVideo.setAttribute('src', '#main-video');
  // sceneEl.appendChild(vSphere);
}

</script>

<style lang="scss">
#main-container {
  position: absolute;
  left: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
}
#main-video {
  z-index: 50;
  position: fixed;
  left: 0;
  bottom: 0;
  max-width: 20rem;
  max-height: 20rem;
  background-color: aqua;
}

#overlay {
  z-index: 100;
  position: absolute;
  background-color: rgba(100, 100, 150, 0.5);
  font-weight: bold;
  left: 2rem;
  top: 2rem;
}
</style>
