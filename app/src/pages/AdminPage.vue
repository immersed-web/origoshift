<template>
  <QPage padding>
    <!-- <h3>Welcome! Login as Admin!</h3> -->

    <LoginBox
      v-if="!soupStore.connected"
      @submit="submitted"
      class="fixed-center"
    />
    <QCard v-else>
      <QCardSection
        v-if="!soupStore.gatheringState"
        class="row"
        tag="form"
        @submit="createAndJoinGathering(gatheringName)"
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
      </QCardSection>
      <QCardSection>
        <QBtn
          label="create room"
          @click="peer.createAndJoinRoom('secretRoom')"
        />
      </QCardSection>
      <QCardSection>
        <QList>
          <QItem
            v-for="room in soupStore.gatheringState?.rooms"
            :key="room.roomId"
          >
            <p> {{ room.roomId }}: {{ room.roomName }}</p>
          </QItem>
        </QList>
      </QCardSection>
    </QCard>
  </QPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginBox from 'src/components/LoginBox.vue';
import { getJwt, login } from 'src/modules/authClient';
import usePeerClient from 'src/composables/usePeerClient';

import { useSoupStore } from 'src/stores/soupStore';
const soupStore = useSoupStore();
const peer = usePeerClient();

const gatheringName = ref<string>('');

async function createAndJoinGathering (gatheringName:string) {
  const gatheringId = await peer.createGathering(gatheringName);
  await peer.joinGathering(gatheringId);
}

async function submitted (creds: Record<string, string>) {
  console.log('adminpage received login data');
  const { username, password } = creds;
  await login(username, password);
  const jwt = await getJwt();
  peer.connect(jwt);
  // router.push()
}
</script>
