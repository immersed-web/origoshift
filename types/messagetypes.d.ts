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

interface RequestMessage extends AbstractMessage {
  request: true,
}
interface SetRtpCapabilities extends AbstractMessage {
  type: 'setRtpCapabilities',
  data: import('mediasoup-client').types.RtpCapabilities
}

interface getRouterRtpCapabilities extends RequestMessage {
  type: 'getRouterRtpCapabilities',
  data: import('mediasoup').types.RtpCapabilities
}

interface CreateSendTransport extends RequestMessage {
  type: 'createSendTransport',
  // data: import('mediasoup').types.WebRtcTransportOptions
}

interface CreateReceiveTransport extends AbstractMessage {
  type: 'createReceiveTransport',
  // data: import('mediasoup').types.DataConsumer
}

type UnknownMessageType = SetRtpCapabilities | getRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport

type SocketMessage<T extends UnknownMessageType> = T