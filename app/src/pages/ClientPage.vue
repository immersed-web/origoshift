<template>
  <QCard
    tag="div"
    id="overlay"
    class="q-pa-md"
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
    <QToggle
      label="skärm i VR"
      v-model="shareInVR"
    />
    <QToggle
      label="stor video"
      v-model="shareFillsScreen"
    />
  </QCard>
  <QBtn
    id="raise-hand-button"
    :class="{waving: handRaised}"
    icon="waving_hand"
    color="primary"
    text-color="yellow"
    round
    @click="toggleRaiseHand"
  />
  <div
    id="main-container"
    class="row justify-between no-wrap items-center content-center"
  >
    <video
      v-show="false"
      id="main-video"
      autoplay
      ref="videoTag"
    />
    <video
      v-show="!shareInVR"
      id="screen-video"
      :class="{'fill-screen': shareFillsScreen }"
      autoplay
      ref="screenTag"
    />
    <a-scene
      embedded
      cursor="rayOrigin: mouse; fuse: false;"
      raycaster="objects: .clickable"
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
      >
        <!-- <a-video
          :visible="shareInVR"
          mixin="rayResize"
          v-show="screenShareConsumerId"
          scale="1 1 0"
          width="1.7777"
          height="1"
          position="1 0 0"
          rotation="0 -90 0"
          id="screenshare-frame"
          class="rotation-target rotation-trigger"
          :class="{raycastable: shareInVR, clickable: shareInVR}"
        /> -->
        <a-box
          mixin="rayResize"
          color="pink"
          position="0 0 -1"
          width="0.25"
          depth="0.25"
          height="0.25"
          class="rotation-target rotation-trigger raycastable clickable"
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
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { useSoupStore } from 'src/stores/soupStore';
import usePeerClient from 'src/composables/usePeerClient';
import { useRouter } from 'vue-router';
import AFRAME, { DetailEvent, Entity } from 'aframe';
import { RoomState } from 'shared-types/CustomTypes';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const router = useRouter();
const peer = usePeerClient();
const soupStore = useSoupStore();

AFRAME.registerComponent<{
  target?: Entity,
  trigger?: Entity,
  rotating?: boolean,
  targetStartRotation?: InstanceType<typeof AFRAME.THREE.Quaternion>,
  startRotation?: InstanceType<typeof AFRAME.THREE.Quaternion>,
  currentRotation?: InstanceType<typeof AFRAME.THREE.Quaternion>,
  deltaRotation?: InstanceType<typeof AFRAME.THREE.Quaternion>,
}>('rotation-control', {
  schema: {
    rotationTrigger: { default: '.rotation-trigger' },
    rotationTarget: { default: '.rotation-target' },
  },
  init: function () {
    this.tick = AFRAME.utils.throttleTick(this.tick!, 10, this);
    this.currentRotation = new AFRAME.THREE.Quaternion();
    this.deltaRotation = new AFRAME.THREE.Quaternion();
    // console.log('AFRAME COMPONENT INITIALIZED!!!!!!!');
    this.target = document.querySelector(this.data.rotationTarget as string);
    // console.log('target is:', this.target);
    this.trigger = document.querySelector(this.data.rotationTrigger as string);
    // console.log('trigger is:', this.trigger);
    this.trigger.addEventListener('mousedown', (ev) => {
      const evt = ev as DetailEvent<{cursorEl: Entity}>;
      if (evt.detail.cursorEl !== this.el) return;
      console.log('triggerdown from within component!', ev);
      if (!this.target) return;
      this.startRotation = new AFRAME.THREE.Quaternion().setFromEuler(this.el.object3D.rotation).conjugate();
      this.targetStartRotation = new AFRAME.THREE.Quaternion().setFromEuler(this.target.object3D.rotation).conjugate();
      this.rotating = true;
    });
    this.trigger.addEventListener('mouseup', (ev) => {
      const evt = ev as DetailEvent<{cursorEl: Entity}>;
      if (evt.detail.cursorEl !== this.el) return;
      console.log('triggerup from within component!', ev);
      this.rotating = false;
    });
  },
  tick: function (time, dt) {
    if (!this.targetStartRotation || !this.deltaRotation || !this.currentRotation || !this.startRotation || !this.rotating || !this.target) return;
    // console.log('updating rotation!', this.el.object3D.rotation.y);
    // this.target.object3D.rotation
    // this.currentRotation.setFromEuler(this.el.object3D.rotation);
    // this.deltaRotation.multiplyQuaternions(this.currentRotation, this.startRotation);
    // const deltaEuler = new AFRAME.THREE.Euler().setFromQuaternion(this.deltaRotation);
    // console.log('delta euler:', deltaEuler);
    // // const startEuler = new AFRAME.THREE.Euler().setFromQuaternion(this.startRotation);
    // const newRotation = new AFRAME.THREE.Quaternion().multiplyQuaternions(this.deltaRotation, this.targetStartRotation);
    // console.log(this.target.object3D.rotation.y);
    // this.target.object3D.rotation.y = new AFRAME.THREE.Euler().setFromQuaternion(this.currentRotation).y;

    this.target.object3D.rotation.setFromVector3(this.el.object3D.rotation.toVector3());
  },
});

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
    videoRotaterTag.value.object3D.rotation.y -= AFRAME.THREE.MathUtils.degToRad(ev.movementX * 0.1);
    const newZ = videoRotaterTag.value.object3D.rotation.z - AFRAME.THREE.MathUtils.degToRad(ev.movementY * 0.1);
    videoRotaterTag.value.object3D.rotation.z = AFRAME.THREE.MathUtils.clamp(newZ, -Math.PI / 4, Math.PI / 4);
  }
});

const shareInVR = ref(true);
const shareFillsScreen = ref(false);
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
  position: fixed;
  left: 0;
  bottom: 0;
  max-width: 30rem;
  max-height: 30rem;
  background-color: aqua;
  transition: all 300ms;
}

.fill-screen {
  max-height: 100vh !important;
  max-width: 100vw !important;
}

#overlay {
  z-index: 100;
  position: absolute;
  background-color: rgba(100, 100, 150, 0.5);
  font-weight: bold;
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
  position: fixed;
  z-index: 1000;
  top: 2rem;
  right: 2rem;
  &.waving {
    animation: wave 0.5s linear 0s infinite alternate;
  }
}
</style>
