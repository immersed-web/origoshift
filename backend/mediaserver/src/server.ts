import { initTRPC, TRPCError } from '@trpc/server';
import { applyWSHandler } from './trpc/ws-adapter';
import { z } from 'zod';
import uWebSockets from 'uWebSockets.js';

import { TypedEmitter } from 'tiny-typed-emitter';

import { attachFilteredEmitter, FilteredEvents } from './trpc/trpc-utils';
import { DecodedJwt, verifyJwtToken } from 'shared-modules/jwtUtils';

// export type UData = {
//   token: string
// }

type ClientEvents = FilteredEvents<{
  'roomState': (room: RoomStateMessage) => void;
  'kickedFromRoom': (roomId: string) => void;
}, DecodedJwt['uuid']>;

const t = initTRPC.context<DecodedJwt>().create();

const publicProcedure = t.procedure;
const router = t.router;


const clientInfo = z.object({
  id: z.string().uuid(),
  role: z.union([z.literal('admin'), z.literal('user'), z.literal('guest')]),
  position: z.optional(z.tuple([z.number(), z.number(), z.number()])),
  currentRoom: z.optional(z.string()),
  clientEmitter: z.custom<TypedEmitter<ClientEvents>>(d => d instanceof TypedEmitter)
});
type ClientInfo = z.infer<typeof clientInfo>

const clientInfoMessage = clientInfo.pick({
  id: true,
  role: true,
  position: true,
  currentRoom: true
});
type ClientInfoMessage = z.infer<typeof clientInfoMessage>

function getClientInfoMessage(clientInfo: ClientInfo): ClientInfoMessage {
  return clientInfoMessage.parse(clientInfo);
}

const roomState = z.object({
  roomId: z.string(),
  clients: z.object({}).catchall(clientInfo)
});
type RoomState = z.infer<typeof roomState>

const roomStateMessage = roomState.extend({
  clients: z.object({}).catchall(clientInfoMessage)
});
type RoomStateMessage = z.infer<typeof roomStateMessage>

function getRoomStateMessage(roomState: RoomState): RoomStateMessage {
  return roomStateMessage.parse(roomState);
}

const connectedClients: Map<string, ClientInfo> = new Map();
const rooms: Map<string, RoomState> = new Map();

function addUserToRoom(userId: string, roomId: string){
  const room = rooms.get(roomId);
  if(!room)
    throw Error('no room with that id found');
  const client = connectedClients.get(userId);
  if(!client)
    throw Error('no client with that id found');


  room.clients[userId] = client;
  client.currentRoom = room.roomId;
  return room;
}

function broadcastRoomState(room: RoomState, triggeringClient: DecodedJwt['uuid']){
  const roomMessage = getRoomStateMessage(room);
  // console.log('broadcasting room:', roomMessage);
  for(const client of Object.values(room.clients)){
    if(!client.clientEmitter)
      continue;
    client.clientEmitter.emit('roomState', roomMessage, triggeringClient);
    // client.clientEmitter.emit('testEvent', client, client.id, client.id);
  }
}

function getMe(userId: string){
  const me = connectedClients.get(userId);
  if(!me)
    throw new TRPCError({code: 'NOT_FOUND', message: 'didnt self among backedn clients'});
  return me;
}

const roomRouter = router({
  getMyToken: publicProcedure
    .query(({ ctx }) => {
      return ctx.uuid;
    }),
  updateMyPosition: publicProcedure
    .input(z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }))
    .mutation(({input, ctx}) => {
      const me = getMe(ctx.uuid);
      me.position = [input.x, input.y, input.z];
      return 'success';
    }),
  getMyRoom: publicProcedure
    .query(({ ctx }) => {

      const me = getMe(ctx.uuid);
      const err = new TRPCError({code: 'NOT_FOUND', message: 'you are not in a room'});
      if(!me.currentRoom)
        throw err;
      const room = rooms.get(me.currentRoom);
      if(!room)
        throw err;
      return getRoomStateMessage(room);
    }),
  createAndJoinRoom: publicProcedure
    .input(z.string())
    .mutation(({input, ctx})=> {
      rooms.set(input, {
        roomId: input,
        clients: {}
      });
      const room = addUserToRoom(ctx.uuid, input);
      broadcastRoomState(room, ctx.uuid);
      return getRoomStateMessage(room);
    }),
  joinRoom: publicProcedure
    .input(z.string())
    .mutation(({input: roomName, ctx})=> {
      const room = addUserToRoom(ctx.uuid, roomName);
      broadcastRoomState(room, ctx.uuid);
      return getRoomStateMessage(room);
    }),
  onRoomUpdate: publicProcedure.input(z.object({excludeSelf: z.boolean()})).subscription(({input, ctx}) => {
    // console.log('subscription request received:', ctx);
    const me = getMe(ctx.uuid);
    const filter = input.excludeSelf ? me.id : undefined;

    return attachFilteredEmitter(me.clientEmitter, 'roomState', filter);
  }),
});


// Merge routers together
const appRouter = router({
  room: roomRouter,
});

export type AppRouter = typeof appRouter;


// ws server
const { onSocketMessage, onSocketOpen, onSocketClose} = applyWSHandler<AppRouter, DecodedJwt>({
  router: appRouter,
});

const app = uWebSockets.App().ws<DecodedJwt>('/*', {
  upgrade: (res, req, ctx) => {
    // console.log('upgrade request received:', req);
    // console.log('ws ctx:', ctx);
    const token = req.getQuery();
    const decoded = verifyJwtToken(token);
    if(typeof decoded === 'string'){
      throw Error('jwtVerify returned a string. No good!');
    }

    if(!decoded){
      console.error('failed to decode jwt token');
      throw Error('failed to decode token!');
    }
    console.log('decoded jwt:', decoded);

    res.upgrade<DecodedJwt>(decoded,
      /* Spell these correctly */
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol'),
      req.getHeader('sec-websocket-extensions'),
      ctx
    );
  },
  open: (ws) => {
    const uData = Object.assign({}, ws.getUserData());
    onSocketOpen(ws, uData);
    const e: ClientInfo['clientEmitter'] = new TypedEmitter();
    const newClient: ClientInfo = {
      id: uData.uuid,
      role: 'user',
      clientEmitter: e,
    };
    // newClient.clientEmitter.on('roomState', (roomState, filter) => console.log(newClient.id, ': my emitter was triggered:', filter));
    connectedClients.set(uData.uuid, newClient);

  },
  message: (ws, msg) => {
    // console.log('message received: ', msg);
    const msgStr = Buffer.from(msg).toString();
    // console.log('stringified msg:', msgStr);
    onSocketMessage(ws, msgStr);
  },
  close: (ws, code, msg) => {
    const msgStr = Buffer.from(msg).toString();
    // console.log('ws was closed:', code, msgStr);
    onSocketClose(ws, msgStr);
    connectedClients.delete(ws.getUserData().uuid);
  }
});

app.listen(2022, (ls) => {
  console.log('listening on port 2022', ls);
});
