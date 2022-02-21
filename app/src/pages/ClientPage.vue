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
        v-for="client in soupStore.currentRoom?.clients"
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
  </QCard>
  <div
    id="main-container"
    class="row justify-between no-wrap items-center content-center"
  >
    <QBtn
      class="q-ma-md"
      icon="keyboard_arrow_left"
      round
      color="primary"
      @click="prevProducer()"
    />
    <video
      v-show="false"
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
    <QBtn
      class="q-ma-md"
      round
      icon="keyboard_arrow_right"
      color="primary"
      @click="nextProducer()"
    />
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
import { computed, ref, nextTick } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
// import { useUserStore } from 'src/stores/userStore';
import usePeerClient from 'src/composables/usePeerClient';
import { useRouter } from 'vue-router';
import 'aframe';

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();
// const userStore = useUserStore();

// const otherUsersInRoom = computed(() => {
//   const usersInRoom = Object.values(soupStore.currentRoom?.clients);

//   return usersInRoom.filter(client => {
//     return client.clientId !== soupStore.clientState?.clientId;
//   });
// });

soupStore.$subscribe((mutation, state) => {
  if (!state.connected) {
    router.replace('/join');
  }
});

const videoTag = ref<HTMLVideoElement>();
let currentProducerIndex = 0;

const producers = computed(() => {
  const producers = [];
  const rooms = soupStore.gatheringState?.rooms;
  if (!rooms) return [];
  for (const room of Object.values(rooms)) {
    if (room.mainProducer) {
      producers.push({
        roomId: room.roomId,
        producerId: room.mainProducer,
      });
    }
  }
  return producers;
});
// watch(() => producers, (newProducers, oldProducers) => {
//   console.log('watch for producers triggered: ', newProducers, oldProducers);
//   if (oldProducers.value.length === 0 && newProducers.value.length) {
//     consume(producers.value[0]);
//   }
// }, { deep: true });

function nextProducer () {
  currentProducerIndex++;
  currentProducerIndex %= producers.value.length;
  consume(producers.value[currentProducerIndex]);
}

function prevProducer () {
  currentProducerIndex += producers.value.length - 1;
  currentProducerIndex %= producers.value.length;
  consume(producers.value[currentProducerIndex]);
}

async function raiseHand () {
  await peer.setCustomProperties({
    handRaised: true,
  });
}

async function consume (producerInfo: typeof producers.value[number]) {
  await peer.joinRoom(producerInfo.roomId);
  const { track } = await peer.consume(producerInfo.producerId);
  if (!videoTag.value) return;
  videoTag.value.srcObject = new MediaStream([track]);
  await nextTick();
  initVideoSphere();
}
(async () => {
  await peer.getRouterCapabilities();
  await peer.loadMediasoupDevice();
  await peer.createReceiveTransport();
  await peer.sendRtpCapabilities();
  if (producers.value.length) {
    await consume(producers.value[currentProducerIndex]);
  }
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
  if (!vVideo) throw new Error('no videosphere found in DOM!!! What have you done Gunnar??');
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
  max-height: 100vh;
  max-width: 100vw;
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
