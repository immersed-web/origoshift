process.env.DEBUG = 'Venue* Room* mediasoup*';

import observerLogger from './mediasoupObservers';
const printSoupStats = observerLogger();

import printClassInstances from './classInstanceObservers';
import uWebSockets, { WebSocket } from 'uWebSockets.js';
const { DEDICATED_COMPRESSOR_3KB } = uWebSockets;
import { createWorkers } from './modules/mediasoupWorkers';
import { verifyJwtToken } from 'shared-modules/jwtUtils';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { JwtUserData, JwtUserDataSchema, UserRole } from 'schemas';
import { applyWSHandler } from './trpc/ws-adapter';
import { appRouter, AppRouter } from './routers/appRouter';
import { hasAtLeastSecurityLevel } from 'shared-modules/authUtils';

type MyWebsocketType = WebSocket<JwtUserData>;

type TempClient = {
  uuid: string;
  username: string;
  role: UserRole
}

// Usually there is one connection per user. But...
// Privileged users might be allowed to have several connections active simultaneously
const connectedUsers: Map<JwtUserData['uuid'], MyWebsocketType[]> = new Map();
const clientConnections: Map<MyWebsocketType, TempClient> = new Map();

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

// export const t = initTRPC.context<JwtUserData>().create();

// const appRouter = t.router({
//   test: t.procedure.query(() => {
//     return 'hello' as const;
//   }),
//   soup: soupRouter
// });

// export type AppRouter = typeof appRouter;

// export type SnapRouter = typeof snapRouter;

const {onSocketOpen, onSocketMessage, onSocketClose} = applyWSHandler<AppRouter, JwtUserData>({router: appRouter});


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
    console.log('upgrade request received:', req);
    try{
      const receivedToken = req.getQuery();
      console.log('upgrade request provided this token:', receivedToken);
      const validJwt = verifyJwtToken(receivedToken);

      console.log('decoded jwt:', validJwt);

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
      console.log('websocket upgrade was canceled / failed:', msg);
      res.writeStatus('403 Forbidden').end(msg, true);
      return;
    }
  },
  open: (ws) => {
    const userData = ws.getUserData();
    // const wsWrapper = new SocketWrapper(ws);
    console.log('socket opened');
    // const client = new Client({ws, userData });

    const client: TempClient = {...userData};

    clientConnections.set(ws, client);

    // Housekeeping our users and connections
    const wasAlreadyLoggedIn = connectedUsers.has(userData.uuid);
    if(wasAlreadyLoggedIn){
      const activeSockets = connectedUsers.get(userData.uuid)!;
      activeSockets.push(ws);
    } else {
      connectedUsers.set(userData.uuid, [ws]);
    }
    console.log('new client:', client);

    onSocketOpen(ws, userData);
  },
  close: (ws) => {
    const userData = ws.getUserData();
    const client = clientConnections.get(ws);
    if(!client){
      throw Error('a disconnecting client was not in client list! Something is astray!');
    }
    clientConnections.delete(ws);

    let activeSockets = connectedUsers.get(userData.uuid)!;
    activeSockets = activeSockets.filter(s => s !== ws);
    if(activeSockets.length === 0){
      //no active connections. also remove from connectedUsers dictionary
      connectedUsers.delete(userData.uuid);
    }

    // client.onDisconnected();
    console.log('client disconnected:', client.uuid);
    onSocketClose(ws, 'no more');
  }
  //

}).listen(9001, (listenSocket) => {

  if (listenSocket) {
    console.log('listenSocket:' ,listenSocket);
    console.log('Listening to port 9001');
  }

});
