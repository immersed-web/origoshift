interface IPacket {
  id?: number,
  subject: string,
  type: string,
  isResponse?: boolean,
  // data: unknown
}

// Interfaces for outgoing (ie not response) messages

type PossiblyData<Data> = Data extends undefined ? unknown : {data: Data}

// type RequestPacket = Omit<IPacket, 'isResponse'>;
interface IRequest extends IPacket {
  isResponse: false,
}

// type DataRequest<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
//   type: 'dataRequest',
//   subject: Key,
// }
type Request<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  type: 'request'
  subject: Key,
}
type Message<Key, Data = undefined> = IRequest & {
  type: 'message',
  subject: Key,
  // responseNeeded: ResponseBool, 
  data: Data,
}

export type GetRouterRtpCapabilities = Request<'getRouterRtpCapabilities'>
export type CreateSendTransport = Request<'createSendTransport'>;
export type CreateReceiveTransport = Request<'createReceiveTransport'>;
export type ConnectTransport = Request<'connectTransport', {
  id: string,
  dtlsParameters: import('mediasoup').types.DtlsParameters,
}>;
export type CreateConsumer = Request<'createConsumer', {
  producerId: string,
}>
export type CreateRoom = Request<'createRoom', {
  id?: string,
  name?: string,
}>

export type SetRtpCapabilities = Request<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>;
export type JoinGathering = Request<'joinGathering', {
  id: string,
  gatheringName?: string
}>
export type JoinRoom = Request<'joinRoom', {
  id: string,
}>
export type SetName = Request<'setName', {
  name: string,
}>;

export type RoomStateUpdate = Message<'roomState', import('./types').RoomState>;

// type AnyMessage = DataMessage<never, unknown>
// type AnyActionRequest = ActionRequest<string, unknown>
// type AnyDataRequest = DataRequest<string, unknown>
export type AnyMessage = RoomStateUpdate
export type AnyRequest = JoinRoom | JoinGathering | SetRtpCapabilities | SetName | GetRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport | CreateRoom | ConnectTransport | CreateConsumer
// type AnyDataRequest =   

// export type AnyRequest = AnyRequest | AnyDataRequest // | AnyDataMessage

//Interfaces for return Messages
interface IResponse extends IPacket {
  isResponse: true,
  wasSuccess: boolean,
  message?: string,
  id: number
}

type BaseResponse<RequestType extends IPacket, Data> = IResponse & {
  subject: RequestType["subject"],
} & ((PossiblyData<Data> & {wasSuccess: true}) | {wasSuccess: false} )

type Response<RequestType extends AnyRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
  type: 'response'
}

// type DataResponse<RequestType extends AnyDataRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
//   type: 'dataResponse'
// }

// type MessageResponse<RequestType extends Message<unknown, unknown, true>, Data = undefined> = BaseResponse<RequestType, Data> & {
//   type: 'messageResponse'
// }

export type SetRtpCapabilitiesResponse = Response<SetRtpCapabilities>
export type JoinRoomResponse = Response<JoinRoom, {id: string}>
export type JoinGatheringResponse = Response<JoinGathering, {id: string}>
export type GetRouterRtpCapabilitiesResponse = Response<GetRouterRtpCapabilities, import('mediasoup').types.RtpCapabilities>

export type ResponseTo<T> = 
  T extends SetRtpCapabilities? SetRtpCapabilitiesResponse:
  T extends JoinRoom? JoinRoomResponse:
  T extends JoinGathering? JoinGatheringResponse : 
  T extends CreateSendTransport? Response<CreateSendTransport, import('mediasoup-client').types.TransportOptions> : 
  T extends CreateReceiveTransport? Response<CreateReceiveTransport, import('mediasoup-client').types.TransportOptions> : 
  T extends ConnectTransport? Response<ConnectTransport> : 
  T extends CreateConsumer? Response<CreateConsumer, import('mediasoup-client').types.ConsumerOptions> : 
  unknown


export type AnyResponse = SetRtpCapabilitiesResponse | JoinRoomResponse | JoinGatheringResponse | GetRouterRtpCapabilitiesResponse | ResponseTo<CreateSendTransport> | ResponseTo<CreateReceiveTransport> | ResponseTo<ConnectTransport> | ResponseTo<CreateConsumer>
// type AnyDataResponse = 
// type AnyMessageResponse = MessageResponse<never, unknown>

// export type AnyResponse = AnyActionResponse | AnyDataResponse// | AnyMessageResponse

export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

// type AnyResponse = ActionResponse<IPacket, unknown> | DataResponse<IPacket, unknown> | MessageResponse<IPacket, unknown>
// type AnyResponse = AnyActionResponse
export type UnknownMessageType = AnyMessage | AnyRequest | AnyResponse
export type SocketMessage<T extends UnknownMessageType> = T


// export const createMessage: (subject: UnknownMessageType['subject']): UnknownMessageType => {
//   const msg: Partial<UnknownMessageType> = {
//     // type: type,
//     // subject: subject,
//     // isResponse: false,
//   };
//   let providedSubject: UnknownMessageType['subject'] = subject;
//   msg.subject = subject;
//   if(msg.subject){
//     if(msg.subject === 'createReceiveTransport' || msg.subject === 'createSendTransport'){
//       msg.type = 'dataRequest'
//     }
//   }
//   return msg as UnknownMessageType;
// }