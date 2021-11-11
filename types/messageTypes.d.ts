// type PeerServerEventType =  'joinRoom' |
// 'joinGathering' |
// 'setRtpCapabilities' |
// 'createSendTransport' |
// 'createReceiveTransport' |
// 'connectTransport' |
// 'createProducer' |
// 'createConsumer';
// type RoomServerEventType = 'getRouterRtpCapabilities';
// type MediasoupEventType = PeerServerEventType | RoomServerEventType

// type MessageType = MediasoupEventType;



// Interfaces for constraining the other types
interface IAbstractMessage {
  type: string,
  // data: unknown
}
interface IRequestMessage extends IAbstractMessage {
  request: true,
}

interface IAckedMessage extends IAbstractMessage {
  ackNeeded: true;
}


// Actual message types
interface SetRtpCapabilities extends IAbstractMessage {
  type: 'setRtpCapabilities',
  data: import('mediasoup-client').types.RtpCapabilities
}

interface GetRouterRtpCapabilities extends IRequestMessage {
  type: 'getRouterRtpCapabilities',
  // data: import('mediasoup').types.RtpCapabilities
}

interface CreateSendTransport extends IRequestMessage {
  type: 'createSendTransport',
  // data: import('mediasoup').types.WebRtcTransportOptions
}

interface CreateReceiveTransport extends IRequestMessage {
  type: 'createReceiveTransport',
  // data: import('mediasoup').types.DataConsumer
}

interface JoinGathering extends IAckedMessage {
  type: 'joinGathering',
  data: {
    id: string
    gatheringName?: string,
  }
}

interface JoinRoom extends IAckedMessage {
  type: 'joinRoom',
  data: {
    id: string,
  }
}

type NormalMessageType = SetRtpCapabilities 
type AckedMessageType = JoinRoom | JoinGathering
type RequestMessageType =  GetRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport 
type UnknownMessageType = NormalMessageType | AckedMessageType | RequestMessageType | ResponseMessageType

// type SocketMessageAcked<T extends AckedMessageType> = T;
// type SocketRequest<T extends RequestMessageType> = T
type SocketMessage<T extends UnknownMessageType> = T
// type SocketResponse<T extends UnknownResponseType> = T
// type SocketMessageOrResponse<T extends MessageOrResponseType> = T

type ResponseMessageType = RtpCapabilitiesResponse

//Return Messages
interface IResponse extends IAbstractMessage {
  response: true
}

interface RtpCapabilitiesResponse extends IResponse {
  type: 'rtpCapabilitiesResponse',
  data: import('mediasoup').types.RtpCapabilities,
}