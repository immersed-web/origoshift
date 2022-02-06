<template>
  <QPage>
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
        id="main-video"
        class="col"
        autoplay
        ref="videoTag"
      />
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
  </QPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import usePeerClient from 'src/composables/usePeerClient';
import { useRouter } from 'vue-router';

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();

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

async function consume (producerInfo: typeof producers.value[number]) {
  await peer.joinRoom(producerInfo.roomId);
  const { consumerId, track } = await peer.consume(producerInfo.producerId);
  if (!videoTag.value) return;
  videoTag.value.srcObject = new MediaStream([track]);
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

</script>

<style lang="scss">
#main-container {
  width: 100vw;
  height: 100vh;
}
#main-video {
  max-height: 100vh;
  max-width: 100vw;
}
</style>
