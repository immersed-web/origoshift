import { useConnectionStore } from '../stores/connection';
import { pinia } from '../boot/pinia';
import { AnyRequest, AnyResponse, SocketMessage, UnknownMessageType } from 'app/../types/messageTypes';

const requestTimout = 10000;
type RequestResolver = (msg: AnyResponse) => void;
const pendingRequests: Map<number, RequestResolver> = new Map<number, RequestResolver>();

let requestCallback: (msg: AnyRequest) => unknown;

let socket: WebSocket | null = null;
if (process.env.SOCKET_URL) {
  const connectionStore = useConnectionStore(pinia);
  socket = new WebSocket(`ws://${process.env.SOCKET_URL}`);
  socket.onopen = (ev) => {
    console.log('connected: ', ev);
    connectionStore.connected = true;
  };

  socket.addEventListener('message', (ev) => {
    const msg = ev.data as SocketMessage<UnknownMessageType>;
    if (msg.isResponse) {
      try {
        const resolve = pendingRequests.get(msg.id);
        if (resolve) { resolve(msg); }
      } catch (e) {
        console.error(e);
      }
    } else {
      requestCallback(msg);
    }
  });
} else {
  console.error('No socket url provided from environment variables!! Huge error of doom!');
}

export const onRequest = (callback: (msg: AnyRequest) => unknown) => {
  requestCallback = callback;
};

export const send = (msg: SocketMessage<UnknownMessageType>) => {
  const string = JSON.stringify(msg);
  socket?.send(string);
};

export const sendRequest = async (msg: SocketMessage<AnyRequest>) => {
  msg.id = Date.now(); // Questionable if we should set the id here...
  const id = msg.id;
  const msgString = JSON.stringify(msg);
  socket?.send(msgString);
  const promise: Promise<AnyResponse> = new Promise((resolve, reject) => {
    pendingRequests.set(id, resolve);
    setTimeout(() => {
      pendingRequests.delete(id);
      reject(`request timed out: ${id}`);
    }, requestTimout);
  });
  console.log(msg);

  return promise;
};

export default socket;
