<template>
  <QBtn
    v-if="sendToRoomOverview"
    :to="{name: 'controlStart'}"
    round
    icon="arrow_back"
    color="primary"
    class="q-ml-md q-mt-md"
  />
  <div class="fixed-center">
    <h4
      v-if="!soupStore.rooms"
      class="text-center"
    >
      Inga rum aktiva just nu.<br>
      Om något rum startas visas det här.
    </h4>
    <template v-else>
      <h3 class="text-center">
        Aktiva rum just nu:
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
                  :label="(room.customProperties.doorIsOpen || sendToRoomOverview ) ?'Stig in':'Knacka på!'"
                  @click="enterRoom(room.roomId)"
                />
              </div>
            </QItemSection>
          </QItem>
        </QList>
      </QCard>
    </template>
  </div>
</template>

<script setup lang="ts">

import usePeerClient from 'src/composables/usePeerClient';
import { useSoupStore } from 'src/stores/soupStore';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const peer = usePeerClient();
const $q = useQuasar();

peer.on('abort', (reason) => {
  console.error('connection aborted!', reason);
  $q.notify({ type: 'negative', message: 'Du är redan ansluten. Från en annan flik, annan webbläsare, eller annan enhet' });
  router.replace({ name: 'logout' });
});

interface Props {
  sendToRoomOverview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sendToRoomOverview: false,
});

const soupStore = useSoupStore();

(async () => {
  if (!soupStore.gatheringState) {
    await peer.restoreOrInitializeGathering();
  }
})();

// async function knockOnRoom (roomId: string) {
//   console.log('knock on Room not implemented yet!!!!!', roomId);
//   const response = await peer.requestToJoinRoom(roomId);
//   console.log('knock response:', response);
// }

function enterRoom (roomId: string) {
  if (props.sendToRoomOverview) {
    router.push({ name: 'controlRoom', params: { roomId } });
  } else {
    router.push(`/room/${roomId}`);
  }
}

</script>

<style lang="scss">
</style>
