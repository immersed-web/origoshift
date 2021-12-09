import { types as mediasoupClientTypes } from 'mediasoup-client';
import { types as mediasoupTypes } from 'mediasoup';
interface IPacket {
    id?: number;
    subject: string;
    type: string;
}
declare type PossiblyData<Data> = Data extends undefined ? unknown : {
    data: Data;
};
declare type IRequest = IPacket;
declare type RequestBuilder<Key, Data = undefined> = IRequest & PossiblyData<Data> & {
    type: 'request';
    subject: Key;
};
declare type MessageBuilder<Key, Data = undefined> = IRequest & {
    type: 'message';
    subject: Key;
    data: Data;
};
export declare type AnyRequest = RequestBuilder<'getRouterRtpCapabilities'> | RequestBuilder<'setRtpCapabilities', import('mediasoup').types.RtpCapabilities> | RequestBuilder<'createSendTransport'> | RequestBuilder<'createReceiveTransport'> | RequestBuilder<'connectTransport', {
    transportId: string;
    dtlsParameters: import('mediasoup').types.DtlsParameters;
}> | RequestBuilder<'createProducer', {
    transportId: string;
    kind: mediasoupClientTypes.MediaKind;
    rtpParameters: mediasoupClientTypes.RtpParameters;
}> | RequestBuilder<'createConsumer', {
    producerId: string;
}> | RequestBuilder<'createGathering', {
    gatheringName: string;
}> | RequestBuilder<'joinGathering', {
    gatheringId: string;
}> | RequestBuilder<'getRooms'> | RequestBuilder<'createRoom', {
    name: string;
}> | RequestBuilder<'joinRoom', {
    roomId: string;
}> | RequestBuilder<'setName', {
    name: string;
}>;
export declare type AnyMessage = MessageBuilder<'roomState', import('./types').RoomState> | MessageBuilder<'chatMessage', {
    message: string;
}>;
export declare type MessageSubjects = Pick<AnyMessage, 'subject'>['subject'];
export declare type Message<Key extends MessageSubjects> = Extract<AnyMessage, {
    subject: Key;
}>;
export declare type RequestSubjects = Pick<AnyRequest, 'subject'>['subject'];
export declare type Request<Key extends RequestSubjects> = Extract<AnyRequest, {
    subject: Key;
}>;
export declare type MessageOfType<Key extends Pick<UnknownMessageType, 'type'>['type']> = Extract<UnknownMessageType, {
    type: Key;
}>;
interface IResponse extends IPacket {
    isResponse: true;
    wasSuccess: boolean;
    message?: string;
    id: number;
}
declare type BaseResponse<RequestType extends IPacket, Data> = IResponse & {
    subject: RequestType["subject"];
} & ((PossiblyData<Data> & {
    wasSuccess: true;
}) | {
    wasSuccess: false;
});
declare type ResponseBuilder<RequestType extends AnyRequest, Data = undefined> = BaseResponse<RequestType, Data> & {
    type: 'response';
};
export declare type AnyResponse = ResponseBuilder<Request<'setRtpCapabilities'>> | ResponseBuilder<Request<'getRouterRtpCapabilities'>, import('mediasoup').types.RtpCapabilities> | ResponseBuilder<Request<'createSendTransport'>, mediasoupClientTypes.TransportOptions> | ResponseBuilder<Request<'createReceiveTransport'>, mediasoupClientTypes.TransportOptions> | ResponseBuilder<Request<'createConsumer'>, mediasoupClientTypes.ConsumerOptions> | ResponseBuilder<Request<'createProducer'>, {
    producerId: string;
}> | ResponseBuilder<Request<'connectTransport'>> | ResponseBuilder<Request<'setName'>> | ResponseBuilder<Request<'createGathering'>, {
    gatheringId: string;
}> | ResponseBuilder<Request<'joinGathering'>> | ResponseBuilder<Request<'getRooms'>, {
    roomId: string;
    clients: string[];
}[]> | ResponseBuilder<Request<'createRoom'>, {
    roomId: string;
}> | ResponseBuilder<Request<'joinRoom'>>;
export declare type ResponseTo<Key extends RequestSubjects> = Extract<AnyResponse, {
    subject: Key;
}>;
export declare type UnfinishedResponse<T extends AnyResponse> = Omit<T, 'wasSuccess' | 'data'> & {
    wasSuccess?: undefined;
} | T;
export declare type UnknownMessageType = AnyMessage | AnyRequest | AnyResponse;
export declare type SocketMessage<T extends UnknownMessageType> = T;
declare type RequestsWithData = Extract<AnyRequest, {
    data: unknown;
}>;
declare type ResponsesWithData = Extract<AnyResponse, {
    data: unknown;
}>;
declare type DataForResponse<Key extends RequestSubjects> = Pick<Extract<ResponseTo<Key>, ResponsesWithData>, 'data'>['data'];
export declare const createRequest: <Key extends "getRouterRtpCapabilities" | "setRtpCapabilities" | "createSendTransport" | "createReceiveTransport" | "connectTransport" | "createProducer" | "createConsumer" | "createGathering" | "joinGathering" | "getRooms" | "createRoom" | "joinRoom" | "setName">(subject: Key, data?: (Extract<Extract<RequestBuilder<"getRouterRtpCapabilities", undefined>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"setRtpCapabilities", mediasoupTypes.RtpCapabilities>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createSendTransport", undefined>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createReceiveTransport", undefined>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"connectTransport", {
    transportId: string;
    dtlsParameters: import('mediasoup').types.DtlsParameters;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createProducer", {
    transportId: string;
    kind: mediasoupClientTypes.MediaKind;
    rtpParameters: mediasoupClientTypes.RtpParameters;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createConsumer", {
    producerId: string;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createGathering", {
    gatheringName: string;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"joinGathering", {
    gatheringId: string;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"getRooms", undefined>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"createRoom", {
    name: string;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"joinRoom", {
    roomId: string;
}>, {
    subject: Key;
}>, RequestsWithData> | Extract<Extract<RequestBuilder<"setName", {
    name: string;
}>, {
    subject: Key;
}>, RequestsWithData>)["data"] | undefined) => Request<Key>;
export declare const createResponse: <Key extends "getRouterRtpCapabilities" | "setRtpCapabilities" | "createSendTransport" | "createReceiveTransport" | "connectTransport" | "createProducer" | "createConsumer" | "createGathering" | "joinGathering" | "getRooms" | "createRoom" | "joinRoom" | "setName">(subject: Key, id: number, { wasSuccess, data, message }: {
    wasSuccess: boolean;
    data?: (Extract<Extract<IResponse & {
        subject: "setRtpCapabilities";
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "setRtpCapabilities";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "getRouterRtpCapabilities";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "getRouterRtpCapabilities";
    } & {
        data: mediasoupTypes.RtpCapabilities;
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createSendTransport";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createSendTransport";
    } & {
        data: mediasoupClientTypes.TransportOptions;
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createReceiveTransport";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createReceiveTransport";
    } & {
        data: mediasoupClientTypes.TransportOptions;
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createConsumer";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createConsumer";
    } & {
        data: mediasoupClientTypes.ConsumerOptions;
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createProducer";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createProducer";
    } & {
        data: {
            producerId: string;
        };
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "connectTransport";
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "connectTransport";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "setName";
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "setName";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createGathering";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createGathering";
    } & {
        data: {
            gatheringId: string;
        };
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "joinGathering";
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "joinGathering";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "getRooms";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "getRooms";
    } & {
        data: {
            roomId: string;
            clients: string[];
        }[];
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createRoom";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "createRoom";
    } & {
        data: {
            roomId: string;
        };
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "joinRoom";
    } & {
        wasSuccess: true;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData> | Extract<Extract<IResponse & {
        subject: "joinRoom";
    } & {
        wasSuccess: false;
    } & {
        type: 'response';
    }, {
        subject: Key;
    }>, ResponsesWithData>)["data"] | undefined;
    message?: string | undefined;
}) => ResponseTo<Key>;
export {};
//# sourceMappingURL=messageTypes.d.ts.map