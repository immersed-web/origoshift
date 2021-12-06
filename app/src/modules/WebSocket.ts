import { useConnectionStore } from '../stores/connection';
import { pinia } from '../boot/pinia';
import { SocketMessage, UnknownMessageType } from 'app/../types/messageTypes';

let socket: WebSocket | null = null;
if (process.env.SOCKET_URL) {
  const connectionStore = useConnectionStore(pinia);
  socket = new WebSocket(`ws://${process.env.SOCKET_URL}`);
  socket.onopen = (ev) => {
    console.log('connected: ', ev);
    connectionStore.connected = true;
  };
} else {
  console.error('No socke url provided from environment variables');
}

export const send = (msg: SocketMessage<UnknownMessageType>) => {
  if (msg.type === 'dataMessage') {
    const string = JSON.stringify(msg);
    socket?.send(string);
  }
  console.log(msg);
  // socket?.send
};

export default socket;
