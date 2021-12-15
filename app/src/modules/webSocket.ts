import { useConnectionStore } from '../stores/connectionStore';
import { pinia } from '../boot/pinia';
import { AnyRequest, Request, AnyResponse, ResponseTo, SocketMessage, RequestSubjects, UnknownMessageType } from 'shared-types/MessageTypes';

const requestTimeout = 3000;
type RequestResolver = (msg: AnyResponse) => void;
type RequestRejecter = (msg: AnyResponse) => void;
const pendingRequests = new Map<number, {resolve: RequestResolver, reject: RequestRejecter}>();

let onMessageCallback: (msg: UnknownMessageType) => unknown;

let socket: WebSocket | null = null;
export function createSocket (token: string) {
  if (!process.env.SOCKET_URL) {
    console.error('No socket url provided from environment variables!! Huge error of doom!');
    throw new Error('no socket url provided!');
  }
  if (!token) {
    console.error('no auth token provided for socket');
    throw new Error('no auth token provided!');
  }
  const connectionStore = useConnectionStore(pinia);
  try {
    const connectionsString = `ws://${process.env.SOCKET_URL}?${token}`;
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
      setTimeout(() => {
        createSocket(token);
      }, 4000);
    };
    socket.onmessage = handleMessage;
  } catch (e) {
    console.error(e);
    setTimeout(createSocket, 4000);
  }
}
const handleMessage = (ev: MessageEvent) => {
  const parsedMessage = JSON.parse(ev.data);
  if (!parsedMessage) {
    console.error('failed to parse incoming object!!!');
  }
  const msg = parsedMessage as SocketMessage<UnknownMessageType>;
  if ('isResponse' in msg && msg.isResponse) {
    try {
      // const pendingCallbacks = pendingRequests.get(msg.id);
      const callbacks = pendingRequests.get(msg.id);
      if (!callbacks) {
        console.error('callbacks was not available in pendingRequests map!!');
        return;
      }
      const { resolve, reject } = callbacks;
      if (!msg.wasSuccess) {
        // console.error('request rejected', msg);
        reject(msg);
        return;
      }
      console.log(`request '${msg.subject}' resolved`, msg);
      resolve(msg);
      pendingRequests.delete(msg.id);
    } catch (e) {
      console.error(e);
    }
  } else {
    if (onMessageCallback) {
      onMessageCallback(msg);
    } else {
      console.log('message received, but no callback attached');
      console.log('this is the received message: ', msg);
    }
  }
};

export const onSocketReceivedMessage = (callback: (msg: UnknownMessageType) => unknown) => {
  onMessageCallback = callback;
};

export const send = (msg: SocketMessage<UnknownMessageType>) => {
  const string = JSON.stringify(msg);
  socket?.send(string);
};

export const sendRequest = async <T extends RequestSubjects>(msg: SocketMessage<Request<T>>): Promise<ResponseTo<T>> => {
  msg.id = Date.now(); // Questionable if we should set the id here...
  const id = msg.id;
  const msgString = JSON.stringify(msg);
  socket?.send(msgString);
  const promise: Promise<AnyResponse> = new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    setTimeout(() => {
      pendingRequests.delete(id);
      reject(`request timed out: ${id}`);
    }, requestTimeout);
  });
  console.log(msg);
  // type TheResponseType = ResponseTo<>
  // type asdasd = Pick<AnyRequest, 'subject'>['subject']
  // type Resp = ResponseTo<'joinRoom'>

  return promise as Promise<ResponseTo<T>>;
};

// export socket;
