import { useConnectionStore } from '../stores/connection';
import { pinia } from '../boot/pinia';

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

// export send = (msg: SocketMessage<UnknownMessageType>) => {
//   socket?.send
// }

export default socket;
