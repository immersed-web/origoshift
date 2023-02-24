// import { types as mediasoupClientTypes } from 'mediasoup-client';
// import { types as mediasoupTypes } from 'mediasoup';
// // import { GatheringState, RoomState, ClientState, ProducerInfo, RoomProperties, ClientProperties } from './CustomTypes.js';
// import { soupTypes } from './mediasoupTypes.js';

// interface IPacket {
//   id: number,
//   subject: string,
//   type: string,
//   // isResponse?: boolean,
//   // data: unknown
// }

// type PossiblyData<Data> = Data extends undefined ? unknown : { data: Data }

// // Interfaces for outgoing (ie not response) messages
// interface IRequest extends IPacket {
//   type: 'request'
// }
// interface IMessage extends IPacket {
//   type: 'message'
// }

// type RequestBuilder<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
//   subject: Key,
// }
// type MessageBuilder<Key, Data = undefined> = IMessage & {
//   subject: Key,
//   data: Data,
// }

// // const reqBuilder = <Data = undefined>(name: string) => {
// //   function tp(input: RequestBuilder<name, Data>): void {
// //     return
// //   }
// //   return name;
// // }

// // const subj = [
// //   reqBuilder<{test: string}>('test'),
// //   reqBuilder<'bajs', {tessss: string}>(),
// //   reqBuilder<'test', {telkj: string, slkj: number}>(),
// // ]

// // type Anyreq = Parameters<(typeof subj)[number]>[0]

// export type AnyRequest =
//   RequestBuilder<'getRouterRtpCapabilities'>
//   | RequestBuilder<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities>
//   | RequestBuilder<'createSendTransport'>
//   | RequestBuilder<'createReceiveTransport'>
//   | RequestBuilder<'connectTransport', {
//     transportId: string,
//     dtlsParameters: import('mediasoup').types.DtlsParameters,
//   }>
//   | RequestBuilder<'notifyCloseEventRequest', {
//     objectType: 'router' | 'transport' | 'producer' | 'consumer' | 'dataproducer' | 'dataconsumer'
//     objectId: string
//   }>
//   | RequestBuilder<'notifyPauseResumeRequest', {
//     objectType: 'producer' | 'consumer'
//     objectId: string
//     wasPaused: boolean
//   }>
//   | RequestBuilder<'createProducer', {
//     transportId: string,
//     kind: mediasoupClientTypes.MediaKind,
//     rtpParameters: mediasoupClientTypes.RtpParameters,
//     producerInfo: ProducerInfo,
//   }>
//   | RequestBuilder<'createConsumer', {
//     producerId: string,
//   }>
//   | RequestBuilder<'setPauseStateForConsumer', {
//     consumerId: string,
//     paused: boolean
//   }>
//   | RequestBuilder<'getClientState'>
//   | RequestBuilder<'setName', {
//     name: string,
//   }>
//   | RequestBuilder<'findGatheringByName', {
//     name: string
//   }>
//   | RequestBuilder<'createGathering', {
//     gatheringName: string,
//   }>
//   | RequestBuilder<'joinGathering', {
//     gatheringId: string,
//   }>
//   // | RequestBuilder<'joinGatheringAsSender', {
//   //   gatheringId: string,
//   // }>
//   | RequestBuilder<'leaveGathering'>
//   | RequestBuilder<'getGatheringState'>
//   | RequestBuilder<'findRoomByName', {
//     // gatheringName: string,
//     roomName: string
//   }>
//   | RequestBuilder<'createRoom', {
//     name: string,
//   }>
//   | RequestBuilder<'setRoomName', {
//     roomId: string,
//     roomName: string
//   }>
//   | RequestBuilder<'joinRoom', {
//     roomId: string,
//   }>
//   | RequestBuilder<'requestToJoinRoom', {
//     roomId: string,
//   }>
//   | RequestBuilder<'forwardedRequestToJoinRoom', {
//     roomId: string,
//     clientId: string,
//   }>
//   | RequestBuilder<'removeClientFromRoom', {
//     clientId: string,
//     roomId: string,
//   }>
//   | RequestBuilder<'closeAllProducersForClient', {
//     clientId: string,
//   }>
//   | RequestBuilder<'pauseAllProducersForClient', {
//     clientId: string,
//   }>
//   | RequestBuilder<'setForceMuteStateForProducer', {
//     clientId: string,
//     producerId: string,
//     forceMuted: boolean,
//   }>
//   | RequestBuilder<'setForceMuteStateForClient', {
//     clientId: string,
//     forceMuted: boolean,
//   }>
//   // | RequestBuilder<'releaseForceMute', {
//   //   clientId: string,
//   //   producerId: string
//   // }>
//   | RequestBuilder<'leaveRoom'>
//   // | RequestBuilder<'roomStateUpdated', RoomState>
//   | RequestBuilder<'assignMainProducerToRoom', {
//     producerId: string,
//     clientId: string,
//     roomId: string,
//     mediaKind: soupTypes.MediaKind,
//   }>
//   | RequestBuilder<'setCustomClientProperties', ClientProperties>
//   | RequestBuilder<'setCustomRoomProperties', {
//     roomId: string,
//     properties: RoomProperties
//   }>
//   | RequestBuilder<'customRequest', {
//     customRequestType: string,
//     requestData: string | Record<string, unknown>,
//   }>

// export type AnyMessage =
//   MessageBuilder<'gatheringStateUpdated', { newState: GatheringState, reason: string }>
//   | MessageBuilder<'roomStateUpdated', { newState: RoomState, reason: string }>
//   | MessageBuilder<'clientStateUpdated', { newState: ClientState, reason: string }>
//   | MessageBuilder<'notifyCloseEvent', {
//     objectType: 'router' | 'transport' | 'producer' | 'consumer' | 'dataproducer' | 'dataconsumer'
//     objectId: string,
//   }>
// // | MessageBuilder<'chatMessage', {
// //   textMessage: string
// // }>

// export type MessageSubjects = AnyMessage['subject'];
// export type Message<Key extends MessageSubjects> = Extract<AnyMessage, { subject: Key }>

// export type RequestSubjects = AnyRequest['subject'];
// export type Request<Key extends RequestSubjects> = Extract<AnyRequest, { subject: Key }>

// export type AnyMessageOrRequest = AnyMessage | AnyRequest;
// export type MessageOrRequest<Key extends AnyMessageOrRequest> = Extract<AnyMessageOrRequest, { subject: Key }>;

// //Interfaces for return Messages
// interface IResponse extends IPacket {
//   // isResponse: true,
//   type: 'response',
//   wasSuccess: boolean,
//   message?: string,
//   // id: number
// }

// // type BaseResponse<RequestType extends IPacket, Data> = IResponse & {
// //   subject: RequestType["subject"],
// // } & ((PossiblyData<Data> & {wasSuccess: true}) | {wasSuccess: false} )

// // type ResponseBuilder<RequestType extends AnyRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
// //   type: 'response'
// // }

// type ResponseBuilder<Subject extends RequestSubjects, Data = undefined> =
//   IResponse
//   & {
//     subject: Subject
//   }
//   & ((PossiblyData<Data> & { wasSuccess: true }) | { wasSuccess: false, message: string })



// export type AnyResponse =
//   | ResponseBuilder<'setRtpCapabilities'>
//   | ResponseBuilder<'getRouterRtpCapabilities', import('mediasoup').types.RtpCapabilities>
//   | ResponseBuilder<'createSendTransport', mediasoupClientTypes.TransportOptions>
//   | ResponseBuilder<'createReceiveTransport', mediasoupClientTypes.TransportOptions>
//   | ResponseBuilder<'createConsumer', mediasoupClientTypes.ConsumerOptions>
//   | ResponseBuilder<'setPauseStateForConsumer'>
//   | ResponseBuilder<'createProducer', { producerId: string }>
//   | ResponseBuilder<'connectTransport'>
//   | ResponseBuilder<'notifyCloseEventRequest'>
//   | ResponseBuilder<'notifyPauseResumeRequest'>
//   | ResponseBuilder<'setName'>
//   | ResponseBuilder<'getClientState', ClientState>
//   | ResponseBuilder<'findGatheringByName', {
//     id: string
//   }>
//   | ResponseBuilder<'createGathering', GatheringState>
//   | ResponseBuilder<'joinGathering', GatheringState>
//   // | ResponseBuilder<'joinGatheringAsSender'>
//   | ResponseBuilder<'leaveGathering', { gatheringId: string }>
//   | ResponseBuilder<'getGatheringState', GatheringState>
//   | ResponseBuilder<'findRoomByName', {
//     id: string
//   }>
//   | ResponseBuilder<'createRoom', RoomState>
//   | ResponseBuilder<'setRoomName'>
//   | ResponseBuilder<'joinRoom', RoomState>
//   | ResponseBuilder<'requestToJoinRoom', RoomState>
//   | ResponseBuilder<'forwardedRequestToJoinRoom'>
//   | ResponseBuilder<'removeClientFromRoom'>
//   | ResponseBuilder<'closeAllProducersForClient'>
//   | ResponseBuilder<'pauseAllProducersForClient'>
//   | ResponseBuilder<'setForceMuteStateForProducer'>
//   | ResponseBuilder<'setForceMuteStateForClient'>
//   | ResponseBuilder<'leaveRoom', { roomId: string }>
//   | ResponseBuilder<'assignMainProducerToRoom'>
//   | ResponseBuilder<'setCustomClientProperties'>
//   | ResponseBuilder<'setCustomRoomProperties'>
//   | ResponseBuilder<'customRequest', string | Record<string, unknown>>

// export type AnySuccessResponse = Extract<AnyResponse, { wasSuccess: true }>;
// export type AnyFailResponse = Extract<AnyResponse, { wasSuccess: false }>;
// export type SuccessResponseTo<Key extends RequestSubjects> = Extract<AnySuccessResponse, { subject: Key }>;

// export type ResponseTo<Key extends RequestSubjects> = Extract<AnyResponse, { subject: Key }>

// export type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & { wasSuccess?: undefined } | T

// export type UnknownMessageType = AnyMessageOrRequest | AnyResponse

// type MessageTypes = UnknownMessageType['type'];
// export type MessageOfType<Key extends MessageTypes> = Extract<UnknownMessageType, { type: Key }>

// export type SocketMessage<T extends UnknownMessageType> = T

// type AnyRequestWithData = Extract<AnyRequest, { data: unknown }>
// type AnyResponsWithData = Extract<AnyResponse, { data: unknown }>


// // type RequestSubjectsWithData = AnyRequestWithData['subject'];
// type RequestWithData<Key extends RequestSubjects> = Extract<AnyRequestWithData, { subject: Key }>
// type ResponseWithData<Key extends RequestSubjects> = Extract<AnyResponsWithData, { subject: Key }>

// type WithDataSubjects = ResponseWithData<RequestSubjects>['subject']

// // const sub: WithDataSubjects = 'createReceiveTransport';

// type DataForMessage<Subject extends MessageSubjects> = Message<Subject>['data'];
// // type DataForRequest<Key extends RequestSubjects> = Extract<AnyRequestWithData, Request<Key>>['data']
// type DataForRequest<Key extends RequestSubjects> = RequestWithData<Key>['data']
// // type DataForResponse<Key extends RequestSubjects> = Extract<AnyResponsWithData, ResponseTo<Key>>['data']
// type DataForResponse<Key extends WithDataSubjects> = ResponseWithData<Key>['data'];
// // type DataForResponse<Key extends RequestSubjects> = ResponseWithData<Key> extends { data: unknown} ? ResponseWithData<Key>['data']: never
// // const test: DataForResponse<'connectTransport'> = {

// // }

// // type DataForResponse<Key extends RequestSubjects> = ResponseWithData<Key> extends { data: unknown } ?  ResponseWithData<Key>[data] : never

// export const createMessage = <Subject extends MessageSubjects>(subject: Subject, data: DataForMessage<Subject>) => {
//   const msg: Message<Subject> = {
//     id: Date.now(),
//     type: 'message',
//     subject: subject,
//     data: data,
//   } as Message<Subject>
//   return msg;
// }

// export const createRequest = <Key extends RequestSubjects>(subject: Key, data?: DataForRequest<Key>): Request<Key> => {
//   const msg: Request<Key> = {
//     id: Date.now(),
//     type: 'request',
//     subject: subject,
//   } as Request<Key>;
//   if (!data) {
//     return msg;
//   }
//   const msgWithData = msg as RequestWithData<typeof subject>
//   msgWithData.data = data;
//   return msgWithData;
// }


// // type ResponseParams<Subject extends RequestSubjects> = Pick<ResponseTo<Subject>, 'wasSuccess' | 'data' | 'message'>
// type ResponseParams<Subject extends RequestSubjects> = {
//   wasSuccess: true,
//   data?: DataForResponse<Extract<Subject, WithDataSubjects>>,
//   // message?: string
// } |
// {
//   wasSuccess: false,
//   message: string,
// }


// export const createFailResponse = (msg: AnyRequest, message: string) => {
//   return createResponse(msg.subject, msg.id, {
//     wasSuccess: false,
//     message: message,
//   })
// }

// // export const createSuccessResponse = <ReqType extends AnyRequest>(msg: ReqType, data?: DataForResponse<Extract<ReqType['subject'], WithDataSubjects>>) => {
// //   let responseField: ResponseParams<ReqType['subject']>;
// //   if(data !== undefined){
// //     responseField = {
// //       wasSuccess: true,
// //       data: data,
// //     }
// //   } else {
// //     responseField = {
// //       wasSuccess: true
// //     }
// //   }
// //   return createResponse(msg.subject, msg.id, responseField);
// // }

// export const createResponse = <Subject extends RequestSubjects>(subject: Subject, id: number, responseFields: ResponseParams<Subject>): ResponseTo<Subject> => {
//   // const { wasSuccess } = responseFields;
//   const msg: ResponseTo<Subject> = {
//     type: 'response',
//     subject: subject,
//     // isResponse: true,
//     id: id,
//     wasSuccess: responseFields.wasSuccess,
//   } as ResponseTo<Subject>;
//   if (responseFields.wasSuccess === false) {
//     msg.message = responseFields.message;
//   }
//   if (!responseFields.wasSuccess || !responseFields.data) {
//     return msg;
//   }
//   const responseWithData = msg as ResponseWithData<Subject>
//   responseWithData.data = responseFields.data;
//   return responseWithData;
// }
