import { useConnectionStore } from '../stores/connectionStore';
import { pinia } from '../boot/pinia';
import { Request, AnyResponse, SocketMessage, RequestSubjects, UnknownMessageType, SuccessResponseTo, AnySuccessResponse, AnyRequest, AnyMessage } from 'shared-types/MessageTypes';

const requestTimeout = 3000;
type RequestResolver = (msg: AnySuccessResponse) => void;
type RequestRejecter = (msg: unknown) => void;
const pendingRequests = new Map<number, {resolve: RequestResolver, reject: RequestRejecter}>();

let onReqOrMsgCallback: (msg: AnyRequest | AnyMessage) => unknown;

let createSocketTimeout: number;
let socket: WebSocket | null = null;
export function createSocket (token: string) {
  if (createSocketTimeout) {
    window.clearTimeout(createSocketTimeout);
  }
  if (!process.env.MEDIASOUP_URL || !process.env.MEDIASOUP_PATH) {
    console.error('No socket url provided from environment variables!! Huge error of doom!');
    throw new Error('no socket url provided!');
  }
  if (!token) {
    console.error('no auth token provided for socket');
    throw new Error('no auth token provided!');
  }
  const connectionStore = useConnectionStore(pinia);
  try {
    const connectionsString = `ws://${process.env.MEDIASOUP_URL}/${process.env.MEDIASOUP_PATH}?${token}`;
    console.log('creating websocket with connectionsString;', connectionsString);
    socket = new WebSocket(connectionsString);
    socket.onopen = (ev) => {
      console.log('connected: ', ev);
      connectionStore.connected = true;
    };
    socket.onclose = (ev) => {
      console.error(ev);
      console.error('socket closed. will try to reconnect!');
      connectionStore.connected = false;
      createSocketTimeout = window.setTimeout(() => {
        createSocket(token);
      }, 4000);
    };
    socket.onmessage = handleMessage;
  } catch (e) {
    console.error(e);
    createSocketTimeout = window.setTimeout(createSocket, 4000);
  }
}
const handleMessage = (ev: MessageEvent) => {
  const parsedMessage = JSON.parse(ev.data);
  if (!parsedMessage) {
    console.error('failed to parse incoming object!!!');
  }
  const msg = parsedMessage as SocketMessage<UnknownMessageType>;
  if (msg.type === 'response') {
    try {
      const callback = pendingRequests.get(msg.id);
      if (!callback) {
        console.error('callbacks was not available in pendingRequests map!!');
        return;
      }
      const { resolve, reject } = callback;
      if (!msg.wasSuccess) {
        reject(msg.message);
        return;
      }
      console.log(`request '${msg.subject}' resolved`, msg);
      resolve(msg);
      pendingRequests.delete(msg.id);
    } catch (e) {
      console.error(e);
    }
  } else {
    if (onReqOrMsgCallback) {
      onReqOrMsgCallback(msg);
    } else {
      console.log('message received, but no callback attached');
      console.log('this is the received message: ', msg);
    }
  }
};

export const onSocketReceivedReqOrMsg = (callback: (msg: AnyRequest | AnyMessage) => unknown) => {
  onReqOrMsgCallback = callback;
};

export const send = (msg: SocketMessage<UnknownMessageType>) => {
  const string = JSON.stringify(msg);
  socket?.send(string);
  console.log('sending message:', msg);
};

export const sendRequest = async <T extends RequestSubjects>(msg: SocketMessage<Request<T>>): Promise<SuccessResponseTo<T>> => {
  msg.id = Date.now(); // Questionable if we should set the id here...
  const id = msg.id;
  const msgString = JSON.stringify(msg);
  socket?.send(msgString);
  console.log('sending request:', msg);
  const promise: Promise<AnyResponse> = new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    setTimeout(() => {
      pendingRequests.delete(id);
      reject(`request timed out: ${id}`);
    }, requestTimeout);
  });

  return promise as Promise<SuccessResponseTo<T>>;
};
