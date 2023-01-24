import PeerClient from 'src/modules/PeerClient';
import { pinia } from 'src/boot/pinia';
import { useSoupStore } from 'src/stores/soupStore';
import { usePersistedStore } from 'src/stores/persistedStore';
import { useUserStore } from 'src/stores/userStore';

const peer: PeerClient = new PeerClient();

const soupStore = useSoupStore(pinia);
const userStore = useUserStore(pinia);
const persistedStore = usePersistedStore(pinia);

// Attach callbacks! ***************************

peer.on('gatheringStateUpdated', data => {
  console.log('gatheringStateUpdated event triggered!! REASON:', data.reason);
  console.log(data);
  soupStore.setGatheringState(data.newState);
});
peer.on('roomStateUpdated', data => {
  console.log('roomStateUpdated event triggered!! REASON: ', data.reason);
  console.log(data);
  soupStore.setRoomState(data.newState);
});
peer.on('clientStateUpdated', data => {
  console.log('clientStateUpdated event triggered!! REASON: ', data.reason);
  console.log(data);
  soupStore.clientState = data.newState;
});

peer.socketEvents.on('open', () => { soupStore.connected = true; });
peer.socketEvents.on('close', (ev) => {
  if (ev.code === 1006) {
    console.error('not allowed to establish websocket');
    // const router = useRouter();
  }
  soupStore.connected = false;
});

//* ************************************ */

export default function usePeerClient () {
  // const connect = async (token: string) => {
  //   console.log('Connecting peerClient!');
  //   const response = await peer.connect(token);
  //   soupStore.clientState = response.data;
  //   soupStore.connected = true;
  // };

  const disconnect = () => {
    console.log('Disconnecting peerClient!');
    peer.disconnect();
    const soupStore = useSoupStore();
    soupStore.$reset();
    // peer = undefined;
  };

  // eslint-disable-next-line @typescript-eslint/ban-types
  // let customExports: Record<string, Function> = { requestMedia };
  // async function requestMedia (deviceId?: string): Promise<MediaStream> {
  //   // TODO: we should be able to customize the constraints for specific stuff
  //   let constraints: MediaStreamConstraints = {
  //     video: true,
  //   };
  //   if (deviceId) {
  //     constraints = {
  //       video: {
  //         deviceId: deviceId,
  //         // frameRate: 10,
  //       },
  //     };
  //   } else {
  //     console.log('no deviceId provided. Calling with video: true');
  //   }
  //   const localStream = await navigator.mediaDevices.getUserMedia(constraints);
  //   return localStream;
  // }

  // async function createAndJoinRoom (roomName: string) {
  //   const roomState = await peer.createRoom(roomName);
  //   return peer.joinRoom(roomState.roomId);
  // }

  // async function produce (stream: MediaStream, producerInfo?: Record<string, unknown>) {
  //   const track = stream.getVideoTracks()[0];
  //   const producerId = await peer.produce(track, producerInfo);
  //   return producerId;
  // }

  // async function joinGathering (gatheringId: string) {
  //   await peer.joinGathering(gatheringId);
  //   await peer.getRouterCapabilities();
  // }

  async function restoreOrInitializeGathering () {
    console.log('restoreOrInitializeGathering triggered!!');
    if (!userStore.userData || !userStore.jwt) {
      throw new Error('no userstate! is needed to recover gathering');
    }
    if (!soupStore.connected) {
      console.log('not connected. will automatically try to connect.');
      // const { data: clientState } = await peer.connect(userStore.jwt);
      // soupStore.clientState = clientState;
      await peer.connect(userStore.jwt);
    }
    let { gathering: gatheringName } = userStore.userData;
    if (!gatheringName) {
      if (!persistedStore.gatheringName) {
        // persistedStore.gatheringName = await pickGathering();
        throw new Error('no gathering in userStore or persistedStore. Impossible to recover/init gathering connection');
      }
      gatheringName = persistedStore.gatheringName;
    }

    // const gatheringId = await peer.findGathering(gathering);
    const gatheringState = await peer.joinOrCreateGathering(gatheringName);
    soupStore.setGatheringState(gatheringState);
    await peer.getRouterCapabilities();
    await peer.loadMediasoupDevice();
    await peer.sendRtpCapabilities();
  }

  const customExports = { disconnect, restoreOrInitializeGathering };

  return {
    ...peer, // Order matters here! customExports holds some overrides, so it must come after
    ...customExports,
    on: peer.on,
  };
}
