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

type DataRequest<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  type: 'dataRequest',
  subject: Key,
}
type ActionRequest<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  type: 'actionRequest'
  subject: Key,
}
type DataMessage<Key, Data = undefined, ResponseBool extends boolean = false> = IRequest & {
  type: 'dataMessage',
  subject: Key,
  responseNeeded: ResponseBool, 
  data: Data,
}

export type GetRouterRtpCapabilities = DataRequest<'getRouterRtpCapabilities'>
export type CreateSendTransport = DataRequest<'createSendTransport'>;
export type CreateReceiveTransport = DataRequest<'createReceiveTransport'>;

export type SetRtpCapabilities = ActionRequest<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>;
export type JoinGathering = ActionRequest<'joinGathering', {
  id: string,
  gatheringName?: string
}>
export type JoinRoom = ActionRequest<'joinRoom', {
  id: string,
}>
export type SetName = ActionRequest<'setName', {
  name: string,
}>;

export type RoomStateUpdate = DataMessage<'roomState', import('./types').RoomState, false>;

// type AnyMessage = DataMessage<never, unknown>
// type AnyActionRequest = ActionRequest<string, unknown>
// type AnyDataRequest = DataRequest<string, unknown>
type AnyDataMessage = RoomStateUpdate
type AnyActionRequest = JoinRoom | JoinGathering | SetRtpCapabilities | SetName
type AnyDataRequest =  GetRouterRtpCapabilities | CreateSendTransport | CreateReceiveTransport 

export type AnyRequest = AnyActionRequest | AnyDataRequest // | AnyDataMessage

//Interfaces for return Messages
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

export type SetRtpCapabilitiesResponse = ActionResponse<SetRtpCapabilities>
export type JoinRoomResponse = ActionResponse<JoinRoom, {id: string}>
export type JoinGatheringResponse = ActionResponse<JoinGathering, {id: string}>
export type GetRouterRtpCapabilitiesResponse = DataResponse<GetRouterRtpCapabilities, import('mediasoup').types.RtpCapabilities> 

type AnyActionResponse = SetRtpCapabilitiesResponse | JoinRoomResponse | JoinGatheringResponse
type AnyDataResponse = GetRouterRtpCapabilitiesResponse
// type AnyMessageResponse = MessageResponse<never, unknown>

export type AnyResponse = AnyActionResponse | AnyDataResponse// | AnyMessageResponse

export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

// type AnyResponse = ActionResponse<IPacket, unknown> | DataResponse<IPacket, unknown> | MessageResponse<IPacket, unknown>
// type AnyResponse = AnyActionResponse
export type UnknownMessageType = AnyDataMessage | AnyActionRequest | AnyDataRequest | AnyResponse
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