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



interface IMessage {
  subject: string,
  type: string,
  // isResponse: boolean,
  // data: unknown
}

// Interfaces for constraining outgoing (ie not response) messages

type PossiblyData<Data> = Data extends undefined ? unknown : {data: Data}

type DataRequest<Key, Data = undefined> = IMessage & PossiblyData<Data> & {
  type: 'dataRequest',
  subject: Key,
}
type ActionRequest<Key, Data = undefined> = IMessage & PossiblyData<Data> & {
  type: 'actionRequest'
  subject: Key
}
type DataMessage<Key, Data = undefined> = IMessage & {
  type: 'dataMessage',
  subject: Key,
  data: Data,
}

type SetRtpCapabilities = DataMessage<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>;

type GetRouterRtpCapabilities = DataRequest<'getRouterRtpCapabilities'>
type CreateSendTransport = DataRequest<'createSendTransport'>;
type CreateReceiveTransport = DataRequest<'createReceiveTransport'>;
type GetSpecificData = DataRequest<'getStuff', {
  id: string,
}>

type JoinGathering = ActionRequest<'joinGathering', {
  id: string,
  gatheringName?: string
}>
type JoinRoom = ActionRequest<'joinRoom', {
  id: string,
}>

type NormalMessageType = SetRtpCapabilities 
type AckedMessageType = JoinRoom | JoinGathering
type RequestMessageType =  GetRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport 

// type SocketMessageAcked<T extends AckedMessageType> = T;
// type SocketRequest<T extends RequestMessageType> = T
// type SocketResponse<T extends UnknownResponseType> = T
// type SocketMessageOrResponse<T extends MessageOrResponseType> = T


//Return Messages
interface IResponse extends IMessage {
  isResponse: true
}
interface IAckResponse extends IResponse {
  wasSuccess: boolean,
  message?: string
}
interface ISuccessDataResponse extends IAckResponse {
  wasSuccess: true,
  data: unknown,
}
interface IFailDataResponse extends IAckResponse {
  wasSuccess: false
}

interface RtpCapabilitiesResponse extends ISuccessDataResponse {
  type: 'rtpCapabilitiesResponse',
  data: import('mediasoup').types.RtpCapabilities,
}

interface JoinRoomResponse extends IAckResponse {
  type: 'joinRoomResponse',
}

interface JoinGatheringResponse extends IAckResponse {
  type: 'joinGatheringResponse',
}

type DataResponseMessageType = IFailDataResponse | RtpCapabilitiesResponse
type AckResponseMessageType = JoinRoomResponse
type ResponseMessageType = DataResponseMessageType | AckResponseMessageType

interface UknownResponse extends IResponse, IAckResponse {
  data?: unknown,
}


type UnknownMessageType = NormalMessageType | AckedMessageType | RequestMessageType | ResponseMessageType
type SocketMessage<T extends UnknownMessageType> = T