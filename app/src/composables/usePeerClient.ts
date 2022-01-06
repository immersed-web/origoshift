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
      console.log('no deviceId provided. Calling with vide: true');
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

  // async function joinRoom (roomName: string) {
  //   await peer.joinRoom(roomName);
  //   // const capabilities = await peer.getRouterCapabilities();
  //   // await peer.loadMediasoupDevice(capabilities);
  //   // await peer.sendRtpCapabilities();
  // }

  async function createAndJoinRoom (roomName: string) {
    const roomId = await peer.createRoom(roomName);
    await peer.joinRoom(roomId);
  }

  async function startProducing (stream: MediaStream) {
    await peer.createSendTransport();
    const track = stream.getVideoTracks()[0];
    const producerId = await peer.produce(track);
    return producerId;
  }

  async function consume (producerId: string) {
    if (!peer.receiveTransport) {
      await peer.createReceiveTransport();
    }
    return peer.consume(producerId);
  }

  // void (async function () {
  //   await peer.awaitConnection();
  //   console.log('connect promise resolved!');
  //   // const nameResponse = await peer.setName('bajskorv');
  //   // console.log(nameResponse);

  //   // const createResponse = await peer.createRoom('rummet');
  //   // console.log(createResponse);

  //   // const joinResponse = await peer.joinRoom('rummet');
  //   // console.log(joinResponse);

  //   // const response = await peer.getRouterCapabilities();
  //   // console.log(response);
  //   // await peer.loadMediasoupDevice(response);
  //   // await peer.sendRtpCapabilities();

  //   // await peer.createSendTransport();
  //   // await peer.createReceiveTransport();
  // })();
  async function joinGathering (gatheringId: string) {
    await peer.joinGathering(gatheringId);
    await peer.getRouterCapabilities();
    // const rooms = await peer.getGatheringState();
    // roomStore.gatheringState = rooms;
  }

  // const { createGathering, setName, joinRoom, createSendTransport } = peer;

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
  const reExported = pick(peer, ['setName', 'createGathering', 'joinRoom', 'createRoom']);

  return {
    ...reExported,
    // peer,
    // peerId,
    // roomState,
    requestMedia,
    // createGathering,
    joinGathering,
    startProducing,
    consume,
    // createRoom,
    // joinRoom,
    createAndJoinRoom,
    // setName,
    // getRoomsInGathering,
  };

  // const pickExport = (thing: unknown, { ...picks }: Partial<PeerClient>) => {
  //   return 'hello';
  // };
  // pickExport(peer, { createGathering, joinGathering });

  // peer.createGathering('bajs');
  // const pickedExports = (({ createGathering, createReceiveTransport }: PeerClient) => ({ createGathering, , createReceiveTransport }))(peer);
  // return Object.assign({}, customExports, { createGathering, setName, joinRoom, createSendTransport, createReceiveTransport } = peer);

  // return customExports;
}
