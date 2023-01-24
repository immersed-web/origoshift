<template>
  <QPage padding>
    <!-- <h3>Welcome! Login as Admin!</h3> -->

    <QCard>
      <QCardSection
        v-if="!soupStore.gatheringState"
        class="row"
        tag="form"
        @submit.prevent="createAndJoinGathering(gatheringName)"
      >
        <QInput
          outlined
          v-model="gatheringName"
          label="gathering name"
        />
        <QBtn
          label="create event"
          type="submit"
        />
        <QBtn
          label="join event"
          @click="joinEvent"
        />
      </QCardSection>
      <QCardSection>
        <QBtn
          label="create room"
          @click="peer.createRoom('secretRoom')"
        />
      </QCardSection>
      <QCardSection>
        <QList>
          <QItem
            tag="label"
            v-for="room in soupStore.gatheringState?.rooms"
            :key="room.roomId"
          >
            <QItemSection avatar>
              <QRadio
                v-model="selectedRoomId"
                :val="room.roomId"
              />
            </QItemSection>
            <QItemSection>
              {{ room.roomName }}
            </QItemSection>
          </QItem>
        </QList>
      </QCardSection>
      <QCardSection>
        <QList>
          <QItem
            v-for="sender in soupStore.gatheringState?.clients"
            :key="sender.clientId"
          >
            <QList>
              <QItemLabel>
                {{ sender.username }}
              </QItemLabel>
              <QItem
                v-for="producer in sender.producers"
                :key="producer.producerId"
              >
                <QBtn
                  :disable="!selectedRoomId"
                  :label="producer.producerId"
                  @click="peer.assignProducerToRoom(sender.clientId, producer.producerId, selectedRoomId!)"
                />
              </QItem>
            </QList>
          </QItem>
        </QList>
        <pre>{{ soupStore.gatheringState }}</pre>
      </QCardSection>
    </QCard>
  </QPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import usePeerClient from 'src/composables/usePeerClient';

import { useSoupStore } from 'src/stores/soupStore';
const soupStore = useSoupStore();
const peer = usePeerClient();

const gatheringName = ref<string>('testEvent');
const selectedRoomId = ref<string>();
async function createAndJoinGathering (gatheringName:string) {
  const gatheringId = await peer.createGathering(gatheringName);
  await peer.joinGathering(gatheringId);
  soupStore.gatheringState = await peer.getGatheringState();
}

async function joinEvent () {
  const gatheringId = await peer.findGathering(gatheringName.value);
  // await peer.joinGatheringAsSender(gatheringId);
  await peer.joinGathering(gatheringId);
  soupStore.gatheringState = await peer.getGatheringState();
}

// async function assignProducerToCurrentRoom (producerId: string) {
//   peer.assignProducerToRoom();
// }
</script>
