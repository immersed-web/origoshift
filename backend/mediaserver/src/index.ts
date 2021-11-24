import uWebSockets from 'uWebSockets.js';
import Client from './classes/Client';
import Gathering from './classes/Gathering';
import SocketWrapper from './classes/SocketWrapper';
const { DEDICATED_COMPRESSOR_3KB } = uWebSockets;
// import * as msgTypes from '../../../types/messagetypes';

// const msg: msgTypes.SocketMessage 
// const msg: SocketMessage<SpecialMessage>= {
//   type: 'setRtpCapabilities',
//   data: {
//     codecs: []
//   }
// };
// console.log(msg);

// const testFnc = (msg: SocketMessage<UnknownMessageType>) => {
//   // if(isSpecialMessage(msg)){
//   //   console.log(msg);
//   // }
//   if(msg.type === 'dataConsumer'){
//     console.log(msg);

//   }
//   else if(msg.type === 'specialType2'){
//     console.log(msg);
//   }
// };
// testFnc(msg);
// const uWebSockets = require('uWebSockets.js');
// const clients: Client[] = [];
const clients: Map<uWebSockets.WebSocket, Client> = new Map();
const app = uWebSockets.App();

app.ws('/*', {

  /* There are many common helper features */
  idleTimeout: 64,
  maxBackpressure: 1024,
  maxPayloadLength: 512,
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
    //TODO: authenticate received JWT token here. If nice only then we should upgrade to websocket!
    const receivedToken = req.getQuery();
    console.log('upgrade request provided this token: ', receivedToken);
    res.upgrade(
      {},
      /* Spell these correctly */
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol'),
      req.getHeader('sec-websocket-extensions'),
      context
    );
  },
  open: (ws) => {
    const wsWrapper = new SocketWrapper(ws);
    const client = new Client({ws: wsWrapper});
    clients.set(ws, client);
    console.log('client :>> ', client);
  }
  // 
  
}).get('/*', (res, _req) => {

  /* It does Http as well */
  res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
  
}).listen(9001, (listenSocket) => {

  if (listenSocket) {
    console.log('Listening to port 9001');
  }
  
});