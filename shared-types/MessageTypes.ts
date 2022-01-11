import {types as mediasoupClientTypes} from 'mediasoup-client';
import {types as mediasoupTypes} from 'mediasoup';
import { GatheringState, RoomState, ClientState } from './CustomTypes';

interface IPacket {
  id: number,
  subject: string,
  type: string,
  // isResponse?: boolean,
  // data: unknown
}

// Interfaces for outgoing (ie not response) messages
type PossiblyData<Data> = Data extends undefined ? unknown : {data: Data}

interface IRequest extends IPacket {
  type: 'request'
}
interface IMessage extends IPacket {
  type: 'message'
}

type RequestBuilder<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
  subject: Key,
}
type MessageBuilder<Key, Data = undefined> = IMessage & {
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
  | RequestBuilder<'notifyCloseEvent', {
    objectType: 'consumer',
    objectId: string
  }>
  | RequestBuilder<'createProducer', {
    transportId: string, // TODO: is this field needed? Where and when?
    kind: mediasoupClientTypes.MediaKind,
    rtpParameters: mediasoupClientTypes.RtpParameters
  }>
  | RequestBuilder<'createConsumer', {
    producerId: string,
  }>
  | RequestBuilder<'getClientState'>
  | RequestBuilder<'setName', {
    name: string,
  }>
  | RequestBuilder<'createGathering', {
    gatheringName: string,
  }>
  | RequestBuilder<'joinGathering', {
    gatheringId: string,
  }>
  | RequestBuilder<'leaveGathering'>
  | RequestBuilder<'getGatheringState'>
  | RequestBuilder<'createRoom', {
    name: string,
  }>
  | RequestBuilder<'joinRoom', {
    roomId: string,
  }>
  | RequestBuilder<'leaveRoom'>
  | RequestBuilder<'roomStateUpdated', RoomState>

export type AnyMessage = 
  MessageBuilder<'gatheringStateUpdated', GatheringState>
  | MessageBuilder<'notifyCloseEvent', {
    objectType: 'consumer',
    objectId: string,
  }>
  | MessageBuilder<'chatMessage', {
    message: string
  }>

export type MessageSubjects = AnyMessage['subject'];
export type Message<Key extends MessageSubjects> = Extract<AnyMessage, {subject: Key}>

export type RequestSubjects = AnyRequest['subject'];
export type Request<Key extends RequestSubjects> = Extract<AnyRequest, {subject: Key}>

//Interfaces for return Messages
interface IResponse extends IPacket {
  // isResponse: true,
  type: 'response',
  wasSuccess: boolean,
  message?: string,
  // id: number
}

// type BaseResponse<RequestType extends IPacket, Data> = IResponse & {
//   subject: RequestType["subject"],
// } & ((PossiblyData<Data> & {wasSuccess: true}) | {wasSuccess: false} )

// type ResponseBuilder<RequestType extends AnyRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
//   type: 'response'
// }

type ResponseBuilder<Subject extends RequestSubjects, Data = undefined> =
  IResponse
  & {
    subject: Subject
  }
  & ((PossiblyData<Data> & {wasSuccess: true}) | {wasSuccess: false, message: string} )



export type AnyResponse = 
  | ResponseBuilder<'setRtpCapabilities'>
  | ResponseBuilder<'getRouterRtpCapabilities', import('mediasoup').types.RtpCapabilities>
  | ResponseBuilder<'createSendTransport', mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<'createReceiveTransport', mediasoupClientTypes.TransportOptions>
  | ResponseBuilder<'createConsumer', mediasoupClientTypes.ConsumerOptions>
  | ResponseBuilder<'createProducer', {producerId: string}>
  | ResponseBuilder<'connectTransport'>
  | ResponseBuilder<'notifyCloseEvent'>
  | ResponseBuilder<'setName'>
  | ResponseBuilder<'getClientState', ClientState>
  | ResponseBuilder<'createGathering', {gatheringId: string}>
  | ResponseBuilder<'joinGathering'>
  | ResponseBuilder<'leaveGathering', {gatheringId: string}>
  | ResponseBuilder<'getGatheringState', GatheringState>
  | ResponseBuilder<'createRoom', {roomId: string}>
  | ResponseBuilder<'joinRoom'>
  | ResponseBuilder<'leaveRoom', {roomId: string}>
  | ResponseBuilder<'roomStateUpdated'>

export type AnySuccessResponse = Extract<AnyResponse, { wasSuccess: true }>;
export type AnyFailResponse = Extract<AnyResponse, { wasSuccess: false }>;
export type SuccessResponseTo<Key extends RequestSubjects> = Extract<AnySuccessResponse, { subject: Key }>;

export type ResponseTo<Key extends RequestSubjects> = Extract<AnyResponse, {subject: Key}>

export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {wasSuccess?: undefined} | T

export type UnknownMessageType = AnyMessage | AnyRequest | AnyResponse

type MessageTypes = UnknownMessageType['type'];
export type MessageOfType<Key extends MessageTypes> = Extract<UnknownMessageType, {type: Key}>

export type SocketMessage<T extends UnknownMessageType> = T

type AnyRequestWithData = Extract<AnyRequest, {data: unknown}>
type AnyResponsWithData = Extract<AnyResponse, {data: unknown}>

// type RequestSubjectsWithData = AnyRequestWithData['subject'];
type RequestWithData<Key extends RequestSubjects> = Extract<AnyRequestWithData, {subject: Key}>
type ResponseWithData<Key extends RequestSubjects> = Extract<AnyResponsWithData, {subject: Key}>

type DataForMessage<Subject extends MessageSubjects> = Message<Subject>['data'];
// type DataForRequest<Key extends RequestSubjects> = Extract<AnyRequestWithData, Request<Key>>['data']
type DataForRequest<Key extends RequestSubjects> = RequestWithData<Key>['data']
// type DataForResponse<Key extends RequestSubjects> = Extract<AnyResponsWithData, ResponseTo<Key>>['data']
type DataForResponse<Key extends RequestSubjects> = ResponseWithData<Key>['data']

export const createMessage = <Subject extends MessageSubjects>(subject: Subject, data: DataForMessage<Subject>) => {
  const msg: Message<Subject> = {
    id: Date.now(),
    type: 'message',
    subject: subject,
    data: data,
  } as Message<Subject>
  return msg;
}

export const createRequest = <Key extends RequestSubjects>(subject: Key, data?: DataForRequest<Key>):Request<Key> => {
  const msg: Request<Key> = {
    id: Date.now(),
    type: 'request',
    subject: subject,
  } as Request<Key>;
  if(!data){
    return msg;
  }
  const msgWithData = msg as RequestWithData<typeof subject>
  msgWithData.data = data;
  return msgWithData;
}

// createRequest<'setName'>('setName', {
//   name: 'coolName'
// });


// type ResponseParams<Subject extends RequestSubjects> = Pick<ResponseTo<Subject>, 'wasSuccess' | 'data' | 'message'>
type ResponseParams<Subject extends RequestSubjects> = {
  wasSuccess: true,
  data?: DataForResponse<Subject>,
  // message?: string
} |
{
  wasSuccess: false,
  message: string,
}

export const createResponse = <Subject extends RequestSubjects>(subject: Subject, id:number, responseFields: ResponseParams<Subject>): ResponseTo<Subject> => {
  // const { wasSuccess } = responseFields;
  const msg: ResponseTo<Subject> = {
    type: 'response',
    subject: subject,
    // isResponse: true,
    id: id,
    wasSuccess: responseFields.wasSuccess,
  } as ResponseTo<Subject>;
  if(responseFields.wasSuccess === false){
    msg.message = responseFields.message;
  }
  if(!responseFields.wasSuccess || !responseFields.data){
    return msg;
  }
  const responseWithData = msg as ResponseWithData<Subject>
  responseWithData.data = responseFields.data;
  return responseWithData;
}