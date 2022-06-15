<template>
  <div
    id="overlay"
    class="q-gutter-md"
  >
    <QBtn
      round
      icon="arrow_back"
      color="primary"
      @click="router.replace({name: 'lobby'})"
    />
    <QCard
      tag="div"
      class="q-pa-md text-weight-bold"
    >
      <QList class="no-pointer-events">
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
    </QCard>
  </div>
  <div
    id="main-container"
    class="column no-wrap"
  >
    <div
      id="vr-container"
      class="col-grow bg-pink relative-position"
    >
      <video
        v-show="false"
        id="main-video"
        autoplay
        ref="videoTag"
      />
      <video
        v-show="screenshareWindowMode !== 'vr'"
        id="screen-video"
        :class="{'fill-screen': screenshareWindowMode === 'big' }"
        autoplay
        ref="screenTag"
      />
      <a-scene
        embedded
        cursor="rayOrigin: mouse; fuse: false;"
        raycaster="objects: .clickable"
        vr-mode-ui="enterVRButton: #vr-button;"
      >
        <a-mixin
          id="rayResize"
          animation__scale="property: scale; to: 1.1 1.1 1.1; dur: 200; startEvents: mouseenter"
          animation__scale_reverse="property: scale; to: 1 1 1; dur: 200; startEvents: mouseleave"
        />
        <a-camera
          ref="cameraTag"
          :look-controls-enabled="!videoIsGrabbed"
          reverse-mouse-drag="true"
          wasd-controls-enabled="false"
        />
        <a-videosphere />
        <a-entity
          ref="videoRotaterTag"
          position="0 1.6 0"
          rotation="0 0 0"
          class="rotation-target"
        >
          <a-video
            :visible="showVRVideoFrame"
            mixin="rayResize"
            scale="1 1 0"
            width="1.7777"
            height="1"
            position="0 0 -1"
            rotation="0 0 0"
            id="screenshare-frame"
            class="rotation-trigger"
            :class="{raycastable: showVRVideoFrame, clickable: showVRVideoFrame}"
            @mousedown="videoGrabbed"
            @mouseup="videoReleased"
          />
        </a-entity>
        <a-entity
          class="controller"
          laser-controls="hand: left"
          raycaster="objects: .raycastable"
        />
        <a-entity
          rotation-control
          class="controller"
          laser-controls="hand: right"
          raycaster="objects: .raycastable"
        />
      </a-scene>
    </div>
    <BottomPanel>
      <QToolbarTitle> Rumsnamn: <span class="text-info">{{ soupStore.roomState?.roomName }}</span></QToolbarTitle>
      <QBtn
        :icon="currentMuteIcon"
        round
        @click="toggleMute"
      >
        <QTooltip>Stäng av eller sätt på mikrofonen</QTooltip>
      </QBtn>
      <QToggle
        label="presentationsläge"
        v-model="screenshareWindowMode"
        toggle-indeterminate
        indeterminate-value="big"
        true-value="vr"
        false-value="small"
        indeterminate-icon="fullscreen"
        checked-icon="3d_rotation"
        unchecked-icon="fullscreen_exit"
      />
      <div class="overflow-hidden">
        <QBtn
          id="raise-hand-button"
          :class="{waving: handRaised}"
          icon="waving_hand"
          color="primary"
          text-color="yellow"
          round
          @click="toggleRaiseHand"
        />
      </div>
      <QBtn
        label="Enter VR"
        id="vr-button"
        color="accent"
        class="q-mr-none"
        rounded
      />
    </BottomPanel>
  </div>
</template>
<script
    setup
    lang="ts"
  >
import { ref, nextTick, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import usePeerClient from 'src/composables/usePeerClient';
import { useRouter } from 'vue-router';
import { THREE, Entity } from 'aframe';
import { RoomState } from 'shared-types/CustomTypes';
import { useQuasar } from 'quasar';
import BottomPanel from 'src/components/BottomPanel.vue';

const $q = useQuasar();

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();

watch(() => soupStore.roomState?.mainProducers, (newMainProducers, oldMainProducers) => {
  if (!newMainProducers) return;
  if (newMainProducers.video && oldMainProducers?.video !== newMainProducers.video) {
    consumeVideo(newMainProducers.video);
  }
  if (newMainProducers.audio && oldMainProducers?.audio !== newMainProducers.audio) {
    consumeAudio(newMainProducers.audio);
  }
}, {
  immediate: true,
});

watch(() => soupStore.roomId, (newRoomId) => {
  if (!newRoomId) {
    router.replace({ name: 'lobby' });
  }
});

peer.on('notifyCloseEvent', (payload) => {
  if (payload.objectType === 'consumer' && payload.objectId === screenShareConsumerId.value) {
    screenShareConsumerId.value = undefined;
  }
});

const muteState = ref<'muted' | 'unmuted' | 'forcedMute'>('muted');
const currentMuteIcon = computed(() => {
  if (muteState.value === 'unmuted') { return 'mic'; } else if (muteState.value === 'forcedMute') { return 'do_not_disturb_on'; }
  return 'mic_off';
});
async function toggleMute () {
  const prevMuteState = muteState.value;
  if (prevMuteState === 'forcedMute') {
    return;
  }
  if (prevMuteState === 'muted') {
    muteState.value = 'unmuted';
    const microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const producerId = await peer.produce(microphoneStream.getAudioTracks()[0]);
    return;
  }
  if (prevMuteState === 'unmuted') {
    muteState.value = 'muted';
  }
}

const showVRVideoFrame = computed(() => {
  // return shareInVR.value && screenShareConsumerId.value !== undefined;
  return screenshareWindowMode.value === 'vr' && screenShareConsumerId.value !== undefined;
});

// TODO: This will not protect from clients "stealing" the broadcasting of the screenshare
let consumedScreenProducerId: string;
const screenShareConsumerId = ref<string>();
watch(() => soupStore.roomState?.clients, async (newClients, _oldCLients) => {
  if (!newClients) return;
  for (const [_clientId, client] of Object.entries(newClients)) {
    for (const [_producerId, producer] of Object.entries(client.producers)) {
      if (producer.producerInfo) {
        if (producer.producerInfo.screenShare) {
          if (producer.producerId !== consumedScreenProducerId) {
            consumedScreenProducerId = producer.producerId;
            console.log('screeeen share!!');
            if (!screenTag.value) return;
            const { track, consumerId } = await peer.consume(producer.producerId);
            // const trackSettings = track.getSettings();
            // console.log('screenshare track settings:', trackSettings);
            // const aspect = trackSettings.aspectRatio;
            screenShareConsumerId.value = consumerId;
            const videoShareElement = screenTag.value;
            videoShareElement.srcObject = new MediaStream([track]);
            // videoShareElement.onloadeddata((ev) => {
            //   console.log(screenTag.value);
            //   const aspect = screenTag.value.videoWidth / screenTag.value.videoHeight;
            //   console.log('calculated aspect from videoTag dimensions:', aspect);
            //   if (aspect) {
            //     console.log('setting width for a-video to:', aspect);
            //     const vVideo = document.querySelector('a-video');
            //     vVideo.setAttribute('width', aspect);
            //   }
            // });
            await nextTick();
            initVideoSphere();
          }
        }
      }
    }
  }
}, { immediate: true, deep: true });

const videoTag = ref<HTMLVideoElement>();
const screenTag = ref<HTMLVideoElement>();

const handRaised = ref<boolean>(false);
async function toggleRaiseHand () {
  handRaised.value = !handRaised.value;
  await peer.setCustomClientProperties({
    handRaised: handRaised.value,
  });
}

const receiveStream = new MediaStream();

async function consumeVideo (producerId: string) {
  if (!videoTag.value) return;
  const { track } = await peer.consume(producerId);
  // videoTag.value.srcObject = new MediaStream([track]);
  receiveStream.addTrack(track);
  await nextTick();
  initVideoSphere();
}

async function consumeAudio (producerId: string) {
  const { track } = await peer.consume(producerId);
  receiveStream.addTrack(track);
}

onMounted(() => {
  if (videoTag.value) {
    videoTag.value.srcObject = receiveStream;
  }
});

onBeforeUnmount(() => {
  // peer.closeAndNotifyAllConsumers();
  // peer.receiveTransport?.close();
  $q.loading.hide();
  peer.setCustomClientProperties({
    handRaised: false,
  });
  if (soupStore.roomId) {
    peer.leaveRoom();
  }
});

//
// ***************
// INITIALIZE
(async () => {
  console.log('CLIENTPAGE INITIALIZE TRIGGERED!!!');
  const route = router.currentRoute.value;

  try {
    // First check if not yet connected to a gathering
    if (!soupStore.gatheringState) {
    // if not, try to connect using stores to choose gatheringName
      await peer.restoreOrInitializeGathering();
    }

    // if success joining gathering, join the room defined by the route!
    if (!route.params.roomId || Array.isArray(route.params.roomId)) {
      throw new Error('no or incorrectly formatted roomId specified in route!');
    }
    if (!peer.receiveTransport) {
      await peer.createReceiveTransport();
    }
    if (!peer.sendTransport) {
      await peer.createSendTransport();
    }

    const roomStateFromGathering = soupStore.gatheringState?.rooms[route.params.roomId];
    let roomState: RoomState;
    if (roomStateFromGathering?.customProperties.doorIsOpen) {
      roomState = await peer.joinRoom(route.params.roomId);
    } else {
      $q.loading.show({
        message: 'väntar på att bli insläppt',
      });
      roomState = await peer.requestToJoinRoom(route.params.roomId);
      $q.loading.hide();
    }

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

const cameraTag = ref<HTMLElement>();
const videoRotaterTag = ref<Entity>();
document.addEventListener('pointermove', (ev) => {
  if (!videoIsGrabbed.value) return;
  if (videoRotaterTag.value) {
    console.log(ev);
    videoRotaterTag.value.object3D.rotation.y -= THREE.MathUtils.degToRad(ev.movementX * 0.1);
    const newZ = videoRotaterTag.value.object3D.rotation.x - THREE.MathUtils.degToRad(ev.movementY * 0.1);
    videoRotaterTag.value.object3D.rotation.x = THREE.MathUtils.clamp(newZ, -Math.PI / 4, Math.PI / 4);
  }
});

const screenshareWindowMode = ref('vr');
const videoIsGrabbed = ref(false);

function videoGrabbed (ev: MouseEvent) {
  console.log('video frame grabbed!', ev);
  videoIsGrabbed.value = true;
  // if (cameraTag.value) {
  //   cameraTag.value.setAttribute('look-controls-enabled', 'false');
  // }
  document.addEventListener('mouseup', videoReleased, { once: true });
}

function videoClicked (ev: MouseEvent) {
  console.log('video frame clicked!', ev);
}

function videoReleased (ev: MouseEvent) {
  console.log('video frame released!', ev);
  videoIsGrabbed.value = false;
  // if (cameraTag.value) {
  //   cameraTag.value.setAttribute('look-controls-enabled', 'true');
  // }
}

// function printEvent (ev: Event) {
//   console.log(ev);
// }

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
  vVideo.setAttribute('src', '#screen-video');
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
    user-select: none;
    }

    #main-video {
    z-index: 50;
    position: fixed;
    left: 30rem;
    bottom: 0;
    max-width: 30rem;
    max-height: 30rem;
    background-color: aqua;
    }

    #screen-video {
    z-index: 50;
    position: absolute;
    left: 0;
    bottom: 0;
    max-width: 30rem;
    max-height: 30rem;
    background-color: aqua;
    transition: all 300ms;
    }

    .fill-screen {
    max-height: 100% !important;
    max-width: 100% !important;
    }

    #overlay {
    z-index: 100;
    position: absolute;
    // background-color: rgba(100, 100, 150, 0.5);
    // font-weight: bold;
    left: 2rem;
    top: 2rem;
    // pointer-events: none;
    }

    @keyframes wave {
    0% {
    transform: rotate(0deg);
    }
    100% {
    transform: rotate(-90deg);
    }
    }

    #raise-hand-button {
    // position: fixed;
    // z-index: 1000;
    // top: 2rem;
    // right: 2rem;
    overflow: hidden;
    &.waving {
    animation: wave 0.5s linear 0s infinite alternate;
    }
    }
  </style>
