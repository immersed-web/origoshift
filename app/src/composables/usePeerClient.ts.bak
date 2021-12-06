import { ref } from 'vue';
import PeerClient from 'ts/PeerClient';
const peer = new PeerClient('localhost:3000');
export default function usePeerClient () {
  let localStream: MediaStream;
  const roomState = ref<RoomState>({});
  const peerId = ref<string>(peer.id);
  console.log('peerId:', peer.id);

  peer.onRoomState = (receivedRoomState) => {
    roomState.value = receivedRoomState;

    // ugly hack to keep peer id updated
    peerId.value = peer.id;
  };

  async function requestMedia (deviceId: string): Promise<MediaStream> {
    // eslint-disable-next-line no-undef
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId,
      },
    };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    // if (videoelement.value) {
    //   videoelement.value.srcObject = stream;
    //   void videoelement.value.play();
    // }
    return localStream;
    // const track = stream.getVideoTracks()[0];
    // const producerId = await peer.produce(track);

    // const consumer = await peer.consume(producerId);
    // const remoteStream: MediaStream = new MediaStream([consumer.track]);
    // if (receivingVideo.value) {
    //   receivingVideo.value.srcObject = remoteStream;
    // }
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

  async function createRoom (roomName: string) {
    await peer.createRoom(roomName);
    await peer.joinRoom(roomName);
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

  void (async function () {
    await peer.awaitConnection();
    console.log('connect promise resolved!');
    // const nameResponse = await peer.setName('bajskorv');
    // console.log(nameResponse);

    // const createResponse = await peer.createRoom('rummet');
    // console.log(createResponse);

    // const joinResponse = await peer.joinRoom('rummet');
    // console.log(joinResponse);

    // const response = await peer.getRouterCapabilities();
    // console.log(response);
    // await peer.loadMediasoupDevice(response);
    // await peer.sendRtpCapabilities();

    // await peer.createSendTransport();
    // await peer.createReceiveTransport();
  })();
  return {
    peer,
    // peerId: peer.id,
    peerId,
    roomState,
    requestMedia,
    startProducing,
    consume,
    joinRoom,
    setName: peer.setName,
    createRoom,
  };
}
