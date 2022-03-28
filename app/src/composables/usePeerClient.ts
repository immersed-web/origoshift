import PeerClient from 'src/modules/PeerClient';
import { useSoupStore } from 'src/stores/soupStore';
import { usePersistedStore } from 'src/stores/persistedStore';
import { useUserStore } from 'src/stores/userStore';

const peer: PeerClient = new PeerClient();
// let peer: PeerClient | undefined;
// export function destroy () {
//   const soupStore = useSoupStore();
//   soupStore.$reset();
//   peer = undefined;
// }
export default function usePeerClient () {
  // if (!peer) {
  //   peer = new PeerClient();
  // }
  const soupStore = useSoupStore();
  const userStore = useUserStore();
  const persistedStore = usePersistedStore();

  // Attach callbacks! ***************************
  peer.on('gatheringStateUpdated', data => {
    console.log('gatheringStateUpdated event triggered!!');
    console.log(data);
    soupStore.setGatheringState(data);
  });
  peer.on('roomStateUpdated', data => {
    console.log('roomStateUpdated event triggered!!');
    console.log(data);
    soupStore.setRoomState(data);
  });
  peer.on('clientStateUpdated', data => {
    console.log('clientStateUpdated event triggered!!');
    console.log(data);
    soupStore.clientState = data;
  });

  peer.socketEvents.on('open', () => { soupStore.connected = true; });
  peer.socketEvents.on('close', () => { soupStore.connected = false; });
  peer.socketEvents.on('request', (reqMsg) => {
    console.log('received request: ', reqMsg);
  });

  //* ************************************ */

  const connect = async (token: string) => {
    const response = await peer.connect(token);
    soupStore.clientState = response.data;
    soupStore.connected = true;
  };

  const disconnect = () => {
    peer.disconnect();
    const soupStore = useSoupStore();
    soupStore.$reset();
    // peer = undefined;
  };

  // eslint-disable-next-line @typescript-eslint/ban-types
  // let customExports: Record<string, Function> = { requestMedia };
  async function requestMedia (deviceId?: string): Promise<MediaStream> {
    // TODO: we should be able to customize the constraints for specific stuff
    let constraints: MediaStreamConstraints = {
      video: true,
    };
    if (deviceId) {
      constraints = {
        video: {
          deviceId: deviceId,
          frameRate: 10,
        },
      };
    } else {
      console.log('no deviceId provided. Calling with video: true');
    }
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
  }

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
    if (!userStore.userData || !userStore.jwt) {
      throw new Error('no userstate! needed to recover gathering');
    }
    if (!soupStore.connected) {
      console.log('not connected. will automatically try to connect.');
      const { data: clientState } = await peer.connect(userStore.jwt);
      soupStore.clientState = clientState;
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
    // await peer.createSendTransport();
  }

  const customExports = { disconnect, connect, requestMedia, restoreOrInitializeGathering };

  return {
    ...peer, // Order matters here! customExports holds some overrides, so it must come after
    ...customExports,
  };
}
