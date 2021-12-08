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
  // responseNeeded: ResponseBool, 
  data: Data,
}
type AnyRequest = 
  RequestBuilder<'getRouterRtpCapabilities'>
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
  | RequestBuilder<'createRoom', {
    roomId?: string,
    name?: string,
  }>
  | RequestBuilder<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>
  | RequestBuilder<'joinGathering', {
    gatheringId: string,
    // gatheringName?: string
  }>
  | RequestBuilder<'joinRoom', {
    roomId: string,
  }>
  | RequestBuilder<'setName', {
    name: string,
  }>

export type AnyMessage = MessageBuilder<'roomState', import('./types').RoomState>

export type SubjectKeys = Pick<AnyRequest, 'subject'>['subject'];
export type Request<Key extends SubjectKeys> = Extract<AnyRequest, {subject: Key}>
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
  | ResponseBuilder<Request<'joinRoom'>, {roomId: string}>
  | ResponseBuilder<Request<'joinGathering'>, {gatheringId: string}>
  | ResponseBuilder<Request<'getRouterRtpCapabilities'>, import('mediasoup').types.RtpCapabilities>
  | ResponseBuilder<Request<'createSendTransport'>, mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<Request<'createReceiveTransport'>, mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<Request<'connectTransport'>>
  | ResponseBuilder<Request<'createConsumer'>, mediasoupClientTypes.ConsumerOptions>
  | ResponseBuilder<Request<'createProducer'>, {producerId: string}>

export type ResponseTo<Key extends SubjectKeys> = Extract<AnyResponse, {subject: Key}>

export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

export type UnknownMessageType = AnyMessage | AnyRequest | AnyResponse
export type SocketMessage<T extends UnknownMessageType> = T

type MessagesWithData = Extract<AnyRequest, {data: unknown}>
// type SubjectKeysWithData = Pick<MessagesWithData, 'subject'>['subject']
type RequestWithData<Key extends SubjectKeys> = Extract<MessagesWithData, {subject: Key}>


type DataForMessage<Key extends SubjectKeys> = Pick<Extract<Request<Key>, MessagesWithData>, 'data'>['data']

export const createRequest = <Key extends SubjectKeys>(subject: Key, data?: DataForMessage<Key>):Request<Key> => {
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