process.env.DEBUG = 'Gathering* Room* mediasoup*';

// import { debug } from 'util';
// const messageLogger = debug('socketMessage');
import observerLogger from './mediasoupObservers';
const printSoupStats = observerLogger();
import printClassInstances from './classInstanceObservers';
import uWebSockets from 'uWebSockets.js';
const { DEDICATED_COMPRESSOR_3KB } = uWebSockets;
import Client from './classes/Client';
import SocketWrapper from './classes/SocketWrapper';
import { createWorkers } from './modules/mediasoupWorkers';
import { verifyJwtToken, DecodedJwt } from 'shared-modules/jwtUtils';

const clients: Map<uWebSockets.WebSocket, Client> = new Map();
const disconnectedClients: Map<string, Client> = new Map();

createWorkers();


const stdin = process.stdin;


if(stdin && stdin.isTTY){
  // without this, we would only get streams once enter is pressed
  stdin.setRawMode( true );
  
  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  stdin.resume();
  
  // i don't want binary, do you?
  stdin.setEncoding( 'utf8' );
  
  // on any data into stdin
  stdin.on( 'data', function( key ){
    const asString = key.toString();
    // ctrl-c ( end of text )
    if ( asString === '\u0003' ) {
      process.exit();
    }
    if(asString === 'm'){
      printSoupStats();
    }
    if(asString === 'c'){
      printClassInstances();
    }
    // write the key to stdout all normal like
    // process.stdout.write( 'bajs' );
  });
}
  

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
    try{
      const receivedToken = req.getQuery();

      // if(!receivedToken){
      //   res.writeStatus('403 Forbidden').end('YOU SHALL NOT PASS!!!');
      //   return;
      // }
    
      console.log('upgrade request provided this token:', receivedToken);

      const decoded = verifyJwtToken(receivedToken);
      if(typeof decoded === 'string'){
        throw Error('jwtVerify returned a string. No good!');
      }

      if(!decoded){
        console.error('failed to decode jwt token');
        throw Error('failed to decode token!');
      }
      console.log('decoded jwt:', decoded);
      res.upgrade(
        {decoded},
        /* Spell these correctly */
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      );
    } catch(e){
      res.writeStatus('403 Forbidden').end('YOU SHALL NOT PASS!!!');
      return;
    }
  },
  open: (ws) => {
    const decodedJwt = ws.decoded as DecodedJwt;
    // const wsWrapper = new SocketWrapper(ws);
    const idleClient = disconnectedClients.get(decodedJwt.uuid);
    let client: Client;
    if(false && idleClient){
      // disconnectedClients.delete(decodedJwt.uuid);
      // idleClient.assignSocketWrapper(wsWrapper);
      // client = idleClient;
      // console.log('socket REopened with provided data: ', decodedJwt);
    } else {
      // console.log('socket opened with provided data: ', decodedJwt);
      console.log('socket opened');
      client = new Client({ws: new SocketWrapper(ws), userData: decodedJwt });
    }
    // Check so client is unique!!

    // client.userData = ws.decoded;
    clients.set(ws, client);
    console.log('client :>> ', client);
  },
  close: (ws) => {
    const client = clients.get(ws);
    if(!client){
      throw Error('a disconnecting client was not in client list! Something is astray!');
    }
    clients.delete(ws);
    if( false && client){
      // disconnectedClients.set(client.id, client);
      // setTimeout(() => {
      //   disconnectedClients.delete(client.id);
      // }, 1000 * 60 * 5);
    }
    client.onDisconnected();
    console.log('client disconnected:', client.id);
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