import uWebSockets from 'uWebSockets.js';
const { DEDICATED_COMPRESSOR_3KB } = uWebSockets;
import Client from './classes/Client';
import SocketWrapper from './classes/SocketWrapper';
import { createWorkers } from './modules/mediasoupWorkers';
import { verifyJwtToken } from 'shared-modules/jwtUtils';

const clients: Map<uWebSockets.WebSocket, Client> = new Map();

createWorkers();


const app = uWebSockets.App();

app.ws('/*', {

  /* There are many common helper features */
  idleTimeout: 64,
  maxBackpressure: 1024,
  // maxPayloadLength: 512,
  compression: DEDICATED_COMPRESSOR_3KB,

  /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
  message: (ws, message) => {
    /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */

    const client = clients.get(ws);
    if(client) {
      // const strMsg = textDecoder.decode(message);
      // console.log('converted message:', strMsg);
      
      // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
      client.ws.incomingMessage(message);
      // console.log('client :>> ', client);
    }
    // console.log('isBinary:', isBinary);

    /* Here we echo the message back, using compression if available */
    // const ok = ws.send(message, isBinary, true);
    // console.log('was ok:', ok);
  },
  upgrade: (res, req, context) => {
    console.log('upgrade request received:', req);
    //TODO: authenticate received JWT token here. If nice, only then should we upgrade to websocket!
    try{
      const receivedToken = req.getQuery();

      // if(!receivedToken){
      //   res.writeStatus('403 Forbidden').end('YOU SHALL NOT PASS!!!');
      //   return;
      // }
    
      console.log('upgrade request provided this token:', receivedToken);

      const decoded = verifyJwtToken(receivedToken);
      if(decoded){
        console.log('decoded jwt:', decoded);
        res.upgrade(
          {decoded},
          /* Spell these correctly */
          req.getHeader('sec-websocket-key'),
          req.getHeader('sec-websocket-protocol'),
          req.getHeader('sec-websocket-extensions'),
          context
        );
      }
    } catch(e){
      res.writeStatus('403 Forbidden').end('YOU SHALL NOT PASS!!!');
      return;
    }
  },
  open: (ws) => {
    console.log('socket opened with provided data: ', ws.decoded);
    const wsWrapper = new SocketWrapper(ws);
    const client = new Client({ws: wsWrapper});
    // client.userData = ws.decoded;
    clients.set(ws, client);
    console.log('client :>> ', client);
  }
  // 
  
}).get('/*', (res, _req) => {

  /* It does Http as well */
  res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
  
}).listen(9001, (listenSocket) => {

  if (listenSocket) {
    console.log('listenSocket:' ,listenSocket);
    console.log('Listening to port 9001');
  }
  
});