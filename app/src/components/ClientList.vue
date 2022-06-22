<template>
  <QCard>
    <QCardSection class="q-pa-none">
      <QList
        separator
      >
        <QItemLabel header>
          I detta rum:
        </QItemLabel>
        <QItem
          v-for="client in clientsWithMuteState"
          :key="client.clientId"
        >
          <QItemSection>
            {{ client.username }}
            <template v-if="client.clientId === clientId">
              (du)
            </template>
          </QItemSection>
          <QItemSection
            v-if="Object.keys(client.producers).length"
          >
            <div>
              <template
                v-for="(producer, key) in client.producers"
                :key="key"
              >
                <span
                  class="emoji"
                  v-if="producer.kind === 'video'"
                >🎥</span>
              </template>
            </div>
          </QItemSection>
          <QItemSection side>
            <QIcon
              id="hand-icon"
              color="yellow"
              v-if="client.customProperties.handRaised"
              name="waving_hand"
            />
          </QItemSection>
          <QItemSection
            v-if="client.clientId !== clientId && !hasAtLeastSecurityLevel(client.role, 'sender')"
            side
          >
            <QBtn
              :icon="client.muteIcon"
              round
              @click="toggleConsume(client)"
            />
            <QBtn
              round
              icon="delete"
              @click="$emit('clientRemoved', client.clientId)"
            />
          </QItemSection>
        </QItem>
      </QList>
      <!-- <pre>
          {{ soupStore.roomState }}
        </pre> -->
    </QCardSection>
    <audio
      ref="audioTag"
      autoplay
    />
  </QCard>
</template>

<script setup lang="ts">
import { ClientState, RoomState } from 'shared-types/CustomTypes';
import { hasAtLeastSecurityLevel } from 'shared-modules/authUtils';
import { defineEmits, ref, computed, watch } from 'vue';
import usePeerClient from 'src/composables/usePeerClient';

defineEmits<{(event: 'clientRemoved', clientId: string): void}>();

const peer = usePeerClient();

const props = defineProps<{
  clients: RoomState['clients'],
  clientId: string
}>();

const muteStateToIcon = {
  unmuted: 'volume_up',
  muted: 'volume_off',
  forceMuted: 'do_not_disturb',
};

const clientsWithMuteState = computed(() => {
  const getMuteState = (client: ClientState) => {
    if (client.customProperties.forceMuted) {
      return 'forceMuted';
    }
    if (Object.keys(client.producers).length === 0) {
      return 'muted';
    } else {
      return 'unmuted';
    }
  };
  return Object.values(props.clients).map(client => {
    const muteState = getMuteState(client);
    return { ...client, muteState: muteState, muteIcon: muteStateToIcon[muteState] };
  });
});

const clientProducers = computed(() => {
  let producers: ClientState['producers'] = {};
  Object.values(props.clients).forEach(client => {
    if (client.role === 'client') {
      producers = { ...producers, ...client.producers };
    }
  });
  return producers;
});

let consumedProducers: Record<string, string> = {};
watch(clientProducers, (producers) => {
  const newConsumedProducers: Record<string, string> = {};
  Object.values(producers).forEach(async producer => {
    if (consumedProducers[producer.producerId]) return;

    if (!peer.receiveTransport) {
      await peer.sendRtpCapabilities();
      await peer.createReceiveTransport();
    }
    const { consumerId, track } = await peer.consume(producer.producerId);
    newConsumedProducers[producer.producerId] = consumerId;
    const audioStream = new MediaStream([track]);
    if (audioTag.value) audioTag.value.srcObject = audioStream;
  });

  consumedProducers = newConsumedProducers;
}, { deep: true, immediate: true });

const audioTag = ref<HTMLAudioElement>();
// TODO: make this depend on producerstate in some way instead of local bool
// let muted = true;
async function toggleConsume (client: (typeof clientsWithMuteState.value)[number]) {
  if (client.muteState === 'unmuted') {
    await peer.closeAllProducersForClient(client.clientId);
    return;
  }
  const newState = client.muteState === 'muted';
  await peer.setForcedMuteStateForClient(client.clientId, newState);

  // const consumerIdForProducer = consumedProducers.value[producerId];
  // if (consumerIdForProducer) {
  //   await peer.closeAndNotifyConsumer(consumerIdForProducer);
  //   delete consumedProducers.value[producerId];
  // } else {
  //   if (!peer.receiveTransport) {
  //     peer.sendRtpCapabilities();
  //     await peer.createReceiveTransport();
  //   }
  //   const { consumerId, track } = await peer.consume(producerId);
  //   consumedProducers.value[producerId] = consumerId;
  //   const audioStream = new MediaStream([track]);
  //   if (audioTag.value) audioTag.value.srcObject = audioStream;
  // }
}

// function computedMuteIcon (client: ClientState) {
//   if (Object.keys(client.producers).length === 0) {
//     return 'volume_off';
//   }
//   if (client.customProperties.forceMuted) {
//     return 'lock';
//   }
//   return 'volume_up';
// }

</script>
<style lang="scss">
@keyframes wave {
  0% {
    transform: translate(0, 10%) rotate(-90deg);
  }
  100% {
    transform: translate(0, 10%) rotate(-10deg);
  }
}

#hand-icon {
  transform-origin: bottom left;
  animation: wave 0.5s linear 0s infinite alternate;
}

.emoji {
  font-size: large;
}
    </style>
