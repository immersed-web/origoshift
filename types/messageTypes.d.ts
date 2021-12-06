interface IPacket {
  subject: string,
  type: string,
  // isResponse?: boolean,
  isResponse?: boolean,
  // data: unknown
}

// Interfaces for outgoing (ie not response) messages

type PossiblyData<Data> = Data extends undefined ? unknown : {data: Data}

type DataRequest<Key, Data = undefined> = IPacket & PossiblyData<Data> & {
  type: 'dataRequest',
  subject: Key,
}
type ActionRequest<Key, Data = undefined> = IPacket & PossiblyData<Data> & {
  type: 'actionRequest'
  subject: Key
}
type DataMessage<Key, Data = undefined, ResponseBool extends boolean = false> = IPacket & {
  type: 'dataMessage',
  subject: Key,
  responseNeeded: ResponseBool, 
  data: Data,
}

type GetRouterRtpCapabilities = DataRequest<'getRouterRtpCapabilities'>
type CreateSendTransport = DataRequest<'createSendTransport'>;
type CreateReceiveTransport = DataRequest<'createReceiveTransport'>;

type SetRtpCapabilities = ActionRequest<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>;
type JoinGathering = ActionRequest<'joinGathering', {
  id: string,
  gatheringName?: string
}>
type JoinRoom = ActionRequest<'joinRoom', {
  id: string,
}>

type RoomStateUpdate = DataMessage<'roomState', RoomState, false>;

// type AnyMessage = DataMessage<never, unknown>
// type AnyActionRequest = ActionRequest<string, unknown>
// type AnyDataRequest = DataRequest<string, unknown>
type AnyDataMessage = RoomStateUpdate
type AnyActionRequest = JoinRoom | JoinGathering | SetRtpCapabilities 
type AnyDataRequest =  GetRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport 


//Interfraces for return Messages
interface IResponse extends IPacket {
  isResponse: true,
  wasSuccess: boolean,
  message?: string,
}

type BaseResponse<RequestType extends IPacket, Data> = IResponse & {
  subject: RequestType["subject"],
} & ((PossiblyData<Data> & {wasSuccess: true}) | {wasSuccess: false} )

type ActionResponse<RequestType extends AnyActionRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
  type: 'actionResponse'
}

type DataResponse<RequestType extends AnyDataRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
  type: 'dataResponse'
}

type MessageResponse<RequestType extends DataMessage<unknown, unknown, true>, Data = undefined> = BaseResponse<RequestType, Data> & {
  type: 'messageResponse'
}

type SetRtpCapabilitiesResponse = ActionResponse<SetRtpCapabilities>
type JoinRoomResponse = ActionResponse<JoinRoom, {id: string}>
type JoinGatheringResponse = ActionResponse<JoinGathering, {id: string}>
type GetRouterRtpCapabilitiesResponse = DataResponse<GetRouterRtpCapabilities, import('mediasoup').types.RtpCapabilities> 

type AnyActionResponse = SetRtpCapabilitiesResponse | JoinRoomResponse | JoinGatheringResponse
type AnyDataResponse = GetRouterRtpCapabilitiesResponse
// type AnyMessageResponse = MessageResponse<never, unknown>

type AnyResponse = AnyActionResponse | AnyDataResponse// | AnyMessageResponse

type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

// type AnyResponse = ActionResponse<IPacket, unknown> | DataResponse<IPacket, unknown> | MessageResponse<IPacket, unknown>
// type AnyResponse = AnyActionResponse
type UnknownMessageType = AnyDataMessage | AnyActionRequest | AnyDataRequest | AnyResponse
type SocketMessage<T extends UnknownMessageType> = T


export { SocketMessage, UnknownMessageType, AnyActionRequest, AnyDataRequest }