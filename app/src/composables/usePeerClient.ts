import PeerClient from 'src/modules/PeerClient';
import { useSoupStore } from 'src/stores/soupStore';
const peer = new PeerClient();
export default function usePeerClient () {
  const soupStore = useSoupStore();

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
  // peer.onMessageCallback = (msg) => {
  //   console.log('received message: ', msg);
  //   switch (msg.subject) {
  //     case 'gatheringStateUpdated': {
  //       soupStore.gatheringState = msg.data;
  //       break;
  //     }
  //     case 'roomStateUpdated': {
  //       soupStore.roomState = msg.data;
  //       break;
  //     }
  //     case 'clientStateUpdated': {
  //       soupStore.clientState = msg.data;
  //       break;
  //     }
  //   }
  // };
  peer.onRequestCallback = (msg) => {
    console.log('received request: ', msg);
  };
  peer.onConsumerClosed = (consumerId) => {
    console.log('consumer close: ', consumerId);
    if (consumerClosedCallback) {
      consumerClosedCallback(consumerId);
    }
  };

  let consumerClosedCallback: (consumerId: string) => unknown | undefined;
  const onConsumerClosed = (callback: typeof consumerClosedCallback) => {
    consumerClosedCallback = callback;
  };
  //* ************************************ */

  async function connect (token:string) {
    const response = await peer.connect(token);
    soupStore.clientState = response.data;
    soupStore.connected = true;
  }

  peer.connectionEvents.on('open', () => { soupStore.connected = true; });
  peer.connectionEvents.on('close', () => { soupStore.connected = false; });

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
        },
      };
    } else {
      console.log('no deviceId provided. Calling with video: true');
    }
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
  }

  async function createAndJoinRoom (roomName: string) {
    const roomId = await peer.createRoom(roomName);
    await peer.joinRoom(roomId);
    return roomId;
  }

  async function produce (stream: MediaStream, producerInfo?: Record<string, unknown>) {
    const track = stream.getVideoTracks()[0];
    const producerId = await peer.produce(track, producerInfo);
    return producerId;
  }

  // async function joinGathering (gatheringId: string) {
  //   await peer.joinGathering(gatheringId);
  //   await peer.getRouterCapabilities();
  // }

  const customExports = { connect, requestMedia, createAndJoinRoom, produce, onConsumerClosed };

  return {
    ...peer, // Order matters here! customExports holds some overrides, so it must come after
    ...customExports,
  };
}
