import {types as mediasoupClientTypes} from 'mediasoup-client';
import {types as mediasoupTypes} from 'mediasoup';

interface IPacket {
  id?: number,
  subject: string,
  type: string,
  // isResponse?: boolean,
  // data: unknown
}

// Interfaces for outgoing (ie not response) messages
type PossiblyData<Data> = Data extends undefined ? unknown : {data: Data}

type IRequest = IPacket

type RequestBuilder<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  type: 'request'
  subject: Key,
}
type MessageBuilder<Key, Data = undefined> = IRequest & {
  type: 'message',
  subject: Key,
  data: Data,
}
export type AnyRequest = 
  RequestBuilder<'getRouterRtpCapabilities'>
  | RequestBuilder<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>
  | RequestBuilder<'createSendTransport'>
  | RequestBuilder<'createReceiveTransport'>
  | RequestBuilder<'connectTransport', {
    transportId: string,
    dtlsParameters: import('mediasoup').types.DtlsParameters,
  }>
  | RequestBuilder<'createProducer', {
    transportId: string, // TODO: is this field needed? Where and when?
    kind: mediasoupClientTypes.MediaKind,
    rtpParameters: mediasoupClientTypes.RtpParameters
  }>
  | RequestBuilder<'createConsumer', {
    producerId: string,
  }>
  | RequestBuilder<'createGathering', {
    gatheringName: string,
  }>
  | RequestBuilder<'joinGathering', {
    gatheringId: string,
  }>
  | RequestBuilder<'getRooms'>
  | RequestBuilder<'createRoom', {
    name: string,
  }>
  | RequestBuilder<'joinRoom', {
    roomId: string,
  }>
  | RequestBuilder<'setName', {
    name: string,
  }>

export type AnyMessage = MessageBuilder<'roomState', import('./types').RoomState>
  | MessageBuilder<'chatMessage', {
    message: string
  }>

export type MessageSubjects = Pick<AnyMessage, 'subject'>['subject'];
export type Message<Key extends MessageSubjects> = Extract<AnyMessage, {subject: Key}>

export type RequestSubjects = Pick<AnyRequest, 'subject'>['subject'];
export type Request<Key extends RequestSubjects> = Extract<AnyRequest, {subject: Key}>


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
  | ResponseBuilder<Request<'getRouterRtpCapabilities'>, import('mediasoup').types.RtpCapabilities>
  | ResponseBuilder<Request<'createSendTransport'>, mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<Request<'createReceiveTransport'>, mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<Request<'createConsumer'>, mediasoupClientTypes.ConsumerOptions>
  | ResponseBuilder<Request<'createProducer'>, {producerId: string}>
  | ResponseBuilder<Request<'connectTransport'>>
  | ResponseBuilder<Request<'setName'>>
  | ResponseBuilder<Request<'createGathering'>, {gatheringId: string}>
  | ResponseBuilder<Request<'joinGathering'>>
  | ResponseBuilder<Request<'getRooms'>, 
    {
      roomId: string,
      clients: string[]
    }[]
  >
  | ResponseBuilder<Request<'createRoom'>, {roomId: string}>
  | ResponseBuilder<Request<'joinRoom'>>

export type ResponseTo<Key extends RequestSubjects> = Extract<AnyResponse, {subject: Key}>

export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

export type UnknownMessageType = AnyMessage | AnyRequest | AnyResponse
export type SocketMessage<T extends UnknownMessageType> = T

type RequestsWithData = Extract<AnyRequest, {data: unknown}>
type ResponsesWithData = Extract<AnyResponse, {data: unknown}>
// type SubjectKeysWithData = Pick<MessagesWithData, 'subject'>['subject']
type RequestWithData<Key extends RequestSubjects> = Extract<RequestsWithData, {subject: Key}>
type ResponseWithData<Key extends RequestSubjects> = Extract<ResponsesWithData, {subject: Key}>

type DataForRequest<Key extends RequestSubjects> = Pick<Extract<Request<Key>, RequestsWithData>, 'data'>['data']
type DataForResponse<Key extends RequestSubjects> = Pick<Extract<ResponseTo<Key>, ResponsesWithData>, 'data'>['data']

export const createRequest = <Key extends RequestSubjects>(subject: Key, data?: DataForRequest<Key>):Request<Key> => {
  const msg: Request<Key> = {} as Request<Key>;
  msg.type = 'request';
  msg.subject = subject;
  if(!data){
    return msg;
  }
  const msgWithData = msg as RequestWithData<Key>
  msgWithData.data = data;
  return msgWithData;
}

// createRequest<'setName'>('setName', {
//   name: 'coolName'
// });

export const createResponse = <Key extends RequestSubjects>(subject: Key, id:number, {wasSuccess, data, message}: {wasSuccess:boolean, data?: DataForResponse<Key>, message?: string }): ResponseTo<Key> => {
  const msg: ResponseTo<Key> = {
    type: 'response',
    subject: subject,
    isResponse: true,
    id: id,
    wasSuccess: wasSuccess,
  } as ResponseTo<Key>;
  if(message){
    msg.message = message;
  }
  if(!data || !msg.wasSuccess){
    return msg;
  }
  const responseWithData = msg as ResponseWithData<Key>
  responseWithData.data = data;
  return responseWithData;
}