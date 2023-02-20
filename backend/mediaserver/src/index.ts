process.env.DEBUG = 'mediasoup*';
process.env.DEBUG = 'uWebSockets*, ' + process.env.DEBUG;

import { Log } from 'debug-level';
Log.options({
  // level: 'DEBUG',
  // splitLine: false,
});
const logUws = new Log('uWebSockets');
logUws.enable(process.env.DEBUG);
console.log('logUws enabled: ',logUws.enabled);

import observerLogger from './mediasoupObservers';
const printSoupStats = observerLogger();

import printClassInstances, { printClientListeners } from './classInstanceObservers';
import uWebSockets, { WebSocket } from 'uWebSockets.js';
const { DEDICATED_COMPRESSOR_3KB } = uWebSockets;
import { createWorkers } from './modules/mediasoupWorkers';
import { verifyJwtToken } from 'shared-modules/jwtUtils';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { ConnectionId, JwtUserData, JwtUserDataSchema, hasAtLeastSecurityLevel } from 'schemas';
import { applyWSHandler } from './trpc/ws-adapter';
import { appRouter, AppRouter } from './routers/appRouter';
import Client from './classes/Client';

export type MyWebsocketType = WebSocket<JwtUserData>;

// Usually there is one connection per user. But...
// Privileged users might be allowed to have several connections active simultaneously
const connectedUsers: Map<JwtUserData['uuid'], MyWebsocketType[]> = new Map();
const clientConnections: Map<MyWebsocketType, Client> = new Map();

createWorkers();

const stdin = process.stdin;

// console.log('environment: ', process.env);

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
    switch(asString){
      case '\u0003' :
        process.exit();
        break;
      case 'm':
        printSoupStats();
        break;
      case 'c':
        printClassInstances(clientConnections);
        break;
      case 'e':
        printClientListeners(clientConnections);
    // write the key to stdout all normal like
    // process.stdout.write( 'bajs' );
    }
  });
}

export type Context = JwtUserData & {
  // uuid: JwtUserData['uuid']
  // jwt: JwtUserData
  connectionId: ConnectionId,
  client: Client
}

const {onSocketOpen, onSocketMessage, onSocketClose} = applyWSHandler<AppRouter, Context>({router: appRouter});


const app = uWebSockets.App();

app.ws<JwtUserData>('/*', {

  /* There are many common helper features */
  idleTimeout: 64,
  maxBackpressure: 1024,
  // maxPayloadLength: 512,
  compression: DEDICATED_COMPRESSOR_3KB,

  message: (ws, message) => {
    const asString = Buffer.from(message).toString();
    onSocketMessage(ws, asString);
  },
  upgrade: (res, req, context) => {
    logUws.debug('upgrade request received:', req);
    try{
      const receivedToken = req.getQuery();
      logUws.debug('upgrade request provided this token:', receivedToken);
      const validJwt = verifyJwtToken(receivedToken);

      logUws.debug('decoded jwt:', validJwt);

      const userDataOnly = JwtUserDataSchema.parse(validJwt);

      const isAlreadyConnected = connectedUsers.has(userDataOnly.uuid);
      if(!hasAtLeastSecurityLevel(userDataOnly.role, 'moderator') && isAlreadyConnected){
        throw Error('already logged in!!!');
      }

      res.upgrade<JwtUserData>(
        userDataOnly,
        /* Spell these correctly */
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      );
    } catch(e){
      const msg = extractMessageFromCatch(e, 'YOU SHALL NOT PASS');
      logUws.info('websocket upgrade was canceled / failed:', msg);
      res.writeStatus('403 Forbidden').end(msg, true);
      return;
    }
  },
  open: (ws) => {
    const jwtUserData = ws.getUserData();
    logUws.info('socket opened');

    const client = new Client({jwtUserData});

    clientConnections.set(ws, client);

    // Housekeeping our users and connections
    const wasAlreadyLoggedIn = connectedUsers.has(jwtUserData.uuid);
    if(wasAlreadyLoggedIn){
      const activeSockets = connectedUsers.get(jwtUserData.uuid)!;
      activeSockets.push(ws);
    } else {
      connectedUsers.set(jwtUserData.uuid, [ws]);
    }
    logUws.debug('new client:', client.getPublicState());

    const context: Context = {...jwtUserData, client, connectionId: client.connectionId };
    onSocketOpen(ws, context);
  },
  close: (ws, code, msg) => {
    logUws.info('socket diconnected:', ws.getUserData());
    const userData = ws.getUserData();
    const client = clientConnections.get(ws);
    if(!client){
      logUws.error('a disconnecting client was not in client list! Something is astray!');
      throw Error('a disconnecting client was not in client list! Something is astray!');
    }
    client.unload();
    clientConnections.delete(ws);

    let activeSockets = connectedUsers.get(userData.uuid)!;
    activeSockets = activeSockets.filter(s => s !== ws);
    if(activeSockets.length === 0){
      //no active connections. also remove from connectedUsers dictionary
      connectedUsers.delete(userData.uuid);
    }

    onSocketClose(ws, Buffer.from(msg).toString());
  }
}).listen(9001, (listenSocket) => {

  if (listenSocket) {
    console.log('listenSocket:' ,listenSocket);
    console.log('Listening to port 9001');
  }

});
