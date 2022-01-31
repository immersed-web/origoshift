// import { ref } from 'vue';
import PeerClient from 'src/modules/PeerClient';
// import { RoomState } from 'app/../types/types';
import { useRoomStore } from 'src/stores/roomStore';
const peer = new PeerClient();
export default function usePeerClient () {
  // let localStream: MediaStream;
  const roomStore = useRoomStore();

  peer.onMessageCallback = (msg) => {
    console.log('received message: ', msg);
    switch (msg.subject) {
      case 'gatheringStateUpdated': {
        roomStore.gatheringState = msg.data;
      }
    }
  };
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

  // async function createGathering (gatheringName: string) {
  //   await peer.createGathering(gatheringName);
  // }

  // async function createRoom (roomName: string) {
  //   // const roomId = await peer.createRoom(roomName);
  //   // return roomId;
  //   await peer.createRoom(roomName);
  //   // const rooms = await peer.getRoomsInGathering();
  //   // roomStore.roomsInGathering = rooms;
  // }

  async function joinRoom (roomId: string) {
    await peer.joinRoom(roomId);
    roomStore.currentRoomId = roomId;
    // const capabilities = await peer.getRouterCapabilities();
    // await peer.loadMediasoupDevice(capabilities);
    // await peer.sendRtpCapabilities();
  }

  // customExports = { createAndJoinRoom, ...customExports };
  async function createAndJoinRoom (roomName: string) {
    const roomId = await peer.createRoom(roomName);
    await peer.joinRoom(roomId);
  }

  // customExports = { ...customExports, startProducing };
  async function produce (stream: MediaStream) {
    const track = stream.getVideoTracks()[0];
    const producerId = await peer.produce(track);
    return producerId;
  }

  // customExports = { ...customExports, consume };
  // async function consumeWithAutoTransport (producerId: string) {
  //   if (!peer.receiveTransport) {
  //     await peer.createReceiveTransport();
  //   }
  //   return peer.consume(producerId);
  // }

  // customExports = { ...customExports, joinGathering };
  async function joinGathering (gatheringId: string) {
    await peer.joinGathering(gatheringId);
    await peer.getRouterCapabilities();
    // const rooms = await peer.getGatheringState();
    // roomStore.gatheringState = rooms;
  }

  // const reExported = () => {
  //   const methods: Record<string, unknown> = {};
  //   // while (depth-- && obj) {
  //   for (const key of Object.getOwnPropertyNames(peer)) {
  //     methods[key] = peer[key];
  //   }
  //   // obj = Reflect.getPrototypeOf(obj);
  //   // }
  //   return methods;
  // };

  function pick<T extends PeerClient, U extends keyof T> (
    obj: T,
    paths: Array<U>,
  ): Pick<T, U> {
    const ret = Object.create(null);
    for (const k of paths) {
      ret[k] = obj[k];
    }
    return ret;
  }

  // const { loadMediasoupDevice } = peer;
  const customExports = { requestMedia, createAndJoinRoom, produce, joinGathering, joinRoom, onConsumerClosed };
  const reExported = pick(peer, ['connect', 'sendRtpCapabilities', 'setName', 'createGathering', 'createRoom', 'loadMediasoupDevice', 'createSendTransport', 'createReceiveTransport', 'consume', 'pauseConsumer']);

  return {
    // loadMediasoupDevice,

    // requestMedia,
    // joinGathering,
    // startProducing,
    // createAndJoinRoom,
    // consume,
    ...reExported,
    // ...peer,
    ...customExports,
    // peer,
    // peerId,
    // roomState,
    // createGathering,
    // createRoom,
    // joinRoom,
    // setName,
    // getRoomsInGathering,
  };
}
