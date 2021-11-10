type PeerServerEventType =  'joinRoom' |
'joinGathering' |
'setRtpCapabilities' 
| 'createSendTransport' 
| 'createReceiveTransport' 
| 'connectTransport' 
| 'createProducer' 
| 'createConsumer';
type RoomServerEventType = 'getRouterRtpCapabilities';
type MediasoupEventType = PeerServerEventType | RoomServerEventType

type MessageType = MediasoupEventType;

interface AbstractMessage {
  type: MessageType,
  data: unknown
}

interface RequestMessage extends AbstractMessage {
  request: true,
}

interface AckedMessage extends AbstractMessage {
  ackNeeded: true;
}
interface SetRtpCapabilities extends AbstractMessage {
  type: 'setRtpCapabilities',
  data: import('mediasoup-client').types.RtpCapabilities
}

interface getRouterRtpCapabilities extends RequestMessage {
  type: 'getRouterRtpCapabilities',
  // data: import('mediasoup').types.RtpCapabilities
}

interface CreateSendTransport extends RequestMessage {
  type: 'createSendTransport',
  // data: import('mediasoup').types.WebRtcTransportOptions
}

interface CreateReceiveTransport extends RequestMessage {
  type: 'createReceiveTransport',
  // data: import('mediasoup').types.DataConsumer
}

interface JoinGathering extends AckedMessage {
  type: 'joinGathering',
  data: {
    id: string
    gatheringName?: string,
  }
}

interface JoinRoom extends AckedMessage {
  type: 'joinRoom',
  data: {
    roomName: string,
  }
}

type UnknownMessageType = SetRtpCapabilities | getRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport | JoinRoom | JoinGathering

type SocketMessage<T extends UnknownMessageType> = T