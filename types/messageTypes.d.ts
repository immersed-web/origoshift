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
  responseNeeded: true,
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

// type SocketMessageAcked<T extends AckedMessageType> = T;
// type SocketRequest<T extends RequestMessageType> = T
// type SocketResponse<T extends UnknownResponseType> = T
// type SocketMessageOrResponse<T extends MessageOrResponseType> = T


//Return Messages
interface IResponse extends IAbstractMessage {
  isResponse: true
}

interface IDataResponse extends IResponse {
  data: unknown
}
interface IAckResponse extends IResponse {
  wasSuccess: boolean,
  message?: string
}

interface RtpCapabilitiesResponse extends IResponse {
  type: 'rtpCapabilitiesResponse',
  data: import('mediasoup').types.RtpCapabilities,
}

interface JoinRoomResponse extends IAckResponse {
  type: 'joinRoomResponse',
}

interface JoinGatheringResponse extends IAckResponse {
  type: 'joinGatheringResponse',
}

type DataResponseMessageType = RtpCapabilitiesResponse
type AckResponseMessageType = JoinRoomResponse
type ResponseMessageType = DataResponseMessageType | AckResponseMessageType


type UnknownMessageType = NormalMessageType | AckedMessageType | RequestMessageType | ResponseMessageType
type SocketMessage<T extends UnknownMessageType> = T