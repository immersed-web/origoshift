type PeerServerEventType =  'setRtpCapabilities' 
| 'createSendTransport' 
| 'createReceiveTransport' 
| 'connectTransport' 
| 'createProducer' 
| 'createConsumer';
type RoomServerEventType = 'getRouterRtpCapabilities';
type MediasSoupEventType = PeerServerEventType | RoomServerEventType

type MessageType = MediasSoupEventType;

interface AbstractMessage {
  type: MessageType,
  data: any
}
interface SpecialMessage extends AbstractMessage {
  type: 'setRtpCapabilities',
  data: import('mediasoup').types.RtpParameters
}

interface SpecialMessage2 extends AbstractMessage {
  type: 'createConsumer',
  data: import('mediasoup').types.RtpCapabilities
}

interface SpecialMessage3 extends AbstractMessage {
  type: 'createSendTransport',
  data: import('mediasoup').types.WebRtcTransportOptions
}

interface VerySpecialMessage extends AbstractMessage {
  type: 'createReceiveTransport',
  data: import('mediasoup').types.DataConsumer
}

type UnknownMessageType = SpecialMessage | SpecialMessage2 | SpecialMessage3 | VerySpecialMessage

type SocketMessage<T extends UnknownMessageType> = T