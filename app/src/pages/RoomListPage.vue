<template>
  <div class="fixed-center">
    <h3 class="text-center">
      ROOMLIST
    </h3>
    <QCard>
      <QList id="room-list">
        <QItem
          :key="room.roomId"
          v-for="room in soupStore.rooms"
        >
          <QItemSection class="q-mr-lg">
            {{ room.roomName }}
          </QItemSection>
          <QItemSection side>
            <div class="q-gutter-md">
              <QBtn
                color="primary"
                label="Knacka på!"
                @click="knockOnRoom(room.roomId)"
              />
              <QBtn
                color="primary"
                label="Stig in"
                @click="enterRoom(room.roomId)"
              />
            </div>
          </QItemSection>
        </QItem>
      </QList>
    </QCard>
  </div>
</template>

<script setup lang="ts">

import usePeerClient from 'src/composables/usePeerClient';
import { useSoupStore } from 'src/stores/soupStore';
import { useRouter } from 'vue-router';

const peer = usePeerClient();
const router = useRouter();

const soupStore = useSoupStore();

// TODO: UNify functionality for "recovering" gathering connection primarily from userdata and secondary from persistedStore.
// Failing triggers either redirect to login or perhaps pickGathering modal?
(async () => {
  if (!soupStore.gatheringState) {
    await peer.restoreOrInitializeGathering();
  }
})();

function knockOnRoom (roomId: string) {
  console.log('knock on Room not implemented yet!!!!!', roomId);
}

function enterRoom (roomId: string) {
  router.push(`/room/${roomId}`);
}

</script>

<style lang="scss">
</style>
