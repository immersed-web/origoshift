// import { ref } from 'vue';
import PeerClient from 'src/modules/PeerClient';
// import { RoomState } from 'app/../types/types';
const peer = new PeerClient();
export default function usePeerClient () {
  let localStream: MediaStream;
  // const roomState = ref<RoomState>();
  // const peerId = ref<string>(peer.id); // TODO: why is this a ref? It will never change, right?
  // console.log('peerId:', peer.id);

  // peer.onRoomState = (receivedRoomState) => {
  //   roomState.value = receivedRoomState;

  //   // ugly hack to keep peer id updated
  //   peerId.value = peer.id;
  // };

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
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
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

  // async function createGathering (gatheringName: string) {
  //   await peer.createGathering(gatheringName);
  // }

  async function createRoom (roomName: string) {
    const roomId = await peer.createRoom(roomName);
    await peer.joinRoom(roomId);
    const capabilities = await peer.getRouterCapabilities();
    await peer.loadMediasoupDevice(capabilities);
    await peer.sendRtpCapabilities();
  }

  async function joinRoom (roomName: string) {
    await peer.joinRoom(roomName);
    const capabilities = await peer.getRouterCapabilities();
    await peer.loadMediasoupDevice(capabilities);
    await peer.sendRtpCapabilities();
  }

  // async function joinRoom (roomName: string) {
  //   await peer.joinRoom(roomName);
  // }

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
  return {
    // peer,
    // peerId,
    // roomState,
    requestMedia,
    startProducing,
    consume,
    createGathering: peer.createGathering,
    createRoom,
    joinRoom,
    setName: peer.setName,
    getRooms: peer.getRooms,
  };
}
