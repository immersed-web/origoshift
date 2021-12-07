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
type RequestBuilder<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  type: 'request'
  subject: Key,
}
type MessageBuilder<Key, Data = undefined> = IRequest & {
  type: 'message',
  subject: Key,
  // responseNeeded: ResponseBool, 
  data: Data,
}
type AnyRequest = 
  RequestBuilder<'getRouterRtpCapabilities'>
  | RequestBuilder<'createSendTransport'>
  | RequestBuilder<'createReceiveTransport'>
  | RequestBuilder<'connectTransport', {
    id: string,
    dtlsParameters: import('mediasoup').types.DtlsParameters,
  }>
  | RequestBuilder<'createConsumer', {
    producerId: string,
  }>
  | RequestBuilder<'createRoom', {
    id?: string,
    name?: string,
  }>
  | RequestBuilder<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>
  | RequestBuilder<'joinGathering', {
    id: string,
    gatheringName?: string
  }>
  | RequestBuilder<'joinRoom', {
    id: string,
  }>
  | RequestBuilder<'setName', {
    name: string,
  }>

export type AnyMessage = MessageBuilder<'roomState', import('./types').RoomState>


export type Request<Key extends Pick<AnyRequest, 'subject'>['subject']> = Extract<AnyRequest, {subject: Key}>
export type MessageOfType<Key extends Pick<UnknownMessageType, 'type'>['type']> = Extract<UnknownMessageType, {type: Key}>

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

type ResponseBuilder<RequestType extends AnyRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
  type: 'response'
}

export type AnyResponse = 
  | ResponseBuilder<Request<'setRtpCapabilities'>>
  | ResponseBuilder<Request<'joinRoom'>, {id: string}>
  | ResponseBuilder<Request<'joinGathering'>, {id: string}>
  | ResponseBuilder<Request<'getRouterRtpCapabilities'>, import('mediasoup').types.RtpCapabilities>

export type ResponseTo<Key extends Pick<AnyRequest, 'subject'>['subject']> = Extract<AnyResponse, {subject: Key}>


export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

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