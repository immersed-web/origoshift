<template>
  <QCard>
    <QCardSection class="q-pa-none">
      <QList
        separator
      >
        <QItem>
          <QItemSection>
            <div class="text-h6">
              I detta rum:
            </div>
          </QItemSection>
          <QItemSection side>
            <QBtn
              round
              :icon="soundOn?'volume_up':'volume_off'"
              @click="toggleSound"
            />
          </QItemSection>
        </QItem>
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
                <audio
                  :ref="(el) => { producerAudioTags[producer.producerId] = el as HTMLAudioElement }"
                  autoplay
                />
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
            <div class="q-gutter-sm">
              <QBtn
                :icon="client.muteIcon"
                round
                @click="toggleConsume(client)"
              />
              <QBtn
                round
                icon="person_remove"
                text-color="negative"
                @click="$emit('clientRemoved', client.clientId)"
              />
            </div>
          </QItemSection>
        </QItem>
      </QList>
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { ClientState, RoomState } from 'shared-types/CustomTypes';
import { hasAtLeastSecurityLevel } from 'shared-modules/authUtils';
import { ref, computed, watch } from 'vue';
import usePeerClient from 'src/composables/usePeerClient';

defineEmits<{(event: 'clientRemoved', clientId: string): void}>();

const peer = usePeerClient();

const props = defineProps<{
  clients: RoomState['clients'],
  clientId: string
}>();

const muteStateToIcon = {
  unmuted: 'mic',
  muted: 'mic_off',
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
  const clients = Object.values(props.clients).map(client => {
    const muteState = getMuteState(client);
    return { ...client, muteState: muteState, muteIcon: muteStateToIcon[muteState] };
  });
  return clients.sort((clientA, clientB) => {
    if (clientA.role === 'client') return 1;
    return -1;
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

const soundOn = ref<boolean>(false);
// NOTE: This is a bit hacky since well be left with dangling keys when the audioelements are removed from the dom.
const producerAudioTags = ref<Record<string, HTMLAudioElement>>({});
let consumedProducers: Record<string, string> = {};
watch(clientProducers, (producers) => {
  if (!soundOn.value) return;
  updateProducelistAndConsumeThem(producers);
}, { deep: true, immediate: true });

function updateProducelistAndConsumeThem (producers: (typeof props.clients)[string]['producers']) {
  console.log('LOOPING PRODUCERS AND CONSUMING TTHEM');
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
    if (producerAudioTags.value[producer.producerId]) producerAudioTags.value[producer.producerId].srcObject = audioStream;
  });

  consumedProducers = newConsumedProducers;
}

async function toggleSound () {
  soundOn.value = !soundOn.value;
  if (!soundOn.value) {
    peer.closeAndNotifyAllConsumers();
    consumedProducers = {};
  } else {
    updateProducelistAndConsumeThem(clientProducers.value);
  }
}

async function toggleConsume (client: (typeof clientsWithMuteState.value)[number]) {
  if (client.muteState === 'unmuted') {
    await peer.closeAllProducersForClient(client.clientId);
    return;
  }
  const newState = client.muteState === 'muted';
  await peer.setForcedMuteStateForClient(client.clientId, newState);
}

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
