import {
  AnyRouter,
  ProcedureType,
  callProcedure,
  TRPCError,
  CombinedDataTransformer,
} from '@trpc/server';
import { Unsubscribable, isObservable } from '@trpc/server/observable';
import {
  JSONRPC2,
  TRPCClientOutgoingMessage,
  TRPCReconnectNotification,
  TRPCResponse,
  TRPCResponseMessage,
} from '@trpc/server/rpc';

function parseMessage(
  obj: unknown,
  transformer: CombinedDataTransformer,
): TRPCClientOutgoingMessage {
  assertIsObject(obj);
  const { method, params, id, jsonrpc } = obj;
  assertIsRequestId(id);
  assertIsJSONRPC2OrUndefined(jsonrpc);
  if (method === 'subscription.stop') {
    return {
      id,
      jsonrpc,
      method,
    };
  }
  assertIsProcedureType(method);
  assertIsObject(params);

  const { input: rawInput, path } = params;
  assertIsString(path);
  const input = transformer.input.deserialize(rawInput);
  return {
    id,
    jsonrpc,
    method,
    params: {
      input,
      path,
    },
  };
}

type BasicSendFunction = (message: string) => void;

interface MinimalWSInterface {
  send: BasicSendFunction
}

export interface WSHandlerOptions<TRouter extends AnyRouter, Ctx> {
  onError?: OnError<Ctx>
  router: TRouter
}

type OnError<Ctx> = (opts: {
  error: TRPCError;
  type: 'query' | 'mutation' | 'subscription' | 'unknown';
  path: string | undefined;
  input: unknown;
  ctx: Ctx;
}) => void

export function applyWSHandler<TRouter extends AnyRouter, Ctx>(opts: WSHandlerOptions<TRouter, Ctx>) {
  const { router, } = opts;
  const { transformer } = router._def._config;

  const websockets: Map<MinimalWSInterface, { subscriptions: Map<number | string, Unsubscribable>, ctx: Ctx }> = new Map();

  const onSocketOpen = (ws: MinimalWSInterface, ctx: Ctx) => {
    // console.log('ws-adapter: ws opened');
    websockets.set(ws, { subscriptions: new Map(), ctx });
  };
  const onSocketMessage = async (ws: MinimalWSInterface, stringifiedMessage: string) => {
    // console.log('ws-adapter: msg received');
    // console.dir(stringifiedMessage);
    try {
      const msgJSON: unknown = JSON.parse(stringifiedMessage);
      const msgs: unknown[] = Array.isArray(msgJSON) ? msgJSON : [msgJSON];
      const promises = msgs
        .map((raw) => parseMessage(raw, transformer))
        .map(msg => handleRequest(ws, msg));
      await Promise.all(promises);
    } catch (cause) {
      const error = new TRPCError({
        code: 'PARSE_ERROR',
        cause: getCauseFromUnknown(cause),
      });

      respond(ws, {
        id: null,
        error: router.getErrorShape({
          error,
          type: 'unknown',
          path: undefined,
          input: undefined,
          ctx: undefined,
        }),
      });
    }
  };

  const onSocketClose = (ws: MinimalWSInterface, msg: string) => {
    // console.log('ws-adapter: ws closed');
    const wsData = websockets.get(ws);
    if(!wsData)
      return;
    const { subscriptions } = wsData;
    for(const sub of subscriptions.values()){
      sub.unsubscribe();
    }
    subscriptions.clear();
    websockets.delete(ws);
  };

  function respond(ws: MinimalWSInterface, untransformedJSON: TRPCResponseMessage) {
    const response = JSON.stringify(transformTRPCResponse(router, untransformedJSON));
    // console.log('created response:', response);
    // return response
    ws.send(response);
  }

  function stopSubscription(
    ws: MinimalWSInterface,
    subscription: Unsubscribable,
    { id, jsonrpc }: { id: JSONRPC2.RequestId } & JSONRPC2.BaseEnvelope,
  ) {
    subscription.unsubscribe();

    respond(ws, {
      id,
      jsonrpc,
      result: {
        type: 'stopped',
      },
    });
  }


  const handleRequest = async (ws: MinimalWSInterface, msg: TRPCClientOutgoingMessage) => {
    if(!ws){
      throw new Error('handler was called with undefined websocket instance');
    }
    const { id, jsonrpc } = msg;
    if (id === null) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '`id` is required',
      });
    }
    const wsData = websockets.get(ws);
    if (!wsData){
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'websocket instance not found in the adapter/handler'
      });
    }
    const { ctx, subscriptions } = wsData;
    if (msg.method === 'subscription.stop') {
      const sub = subscriptions?.get(id);
      if (sub) {
        stopSubscription(ws, sub, { id, jsonrpc });
      }
      subscriptions.delete(id);
      return;
    }
    const { path, input } = msg.params;
    const type = msg.method;
    try {

      const result = await callProcedure({
        procedures: router._def.procedures,
        path,
        rawInput: input,
        ctx,
        type,
      });

      if (type === 'subscription') {
        if (!isObservable(result)) {
          throw new TRPCError({
            message: `Subscription ${path} did not return an observable`,
            code: 'INTERNAL_SERVER_ERROR',
          });
        }
      } else {
        // send the value as data if the method is not a subscription
        respond(ws, {
          id,
          jsonrpc,
          result: {
            type: 'data',
            data: result,
          },
        });
        return;
      }

      const observable = result;
      const sub = observable.subscribe({
        next(data) {
          respond(ws, {
            id,
            jsonrpc,
            result: {
              type: 'data',
              data,
            },
          });
        },
        error(err) {
          const error = getTRPCErrorFromUnknown(err);
          // if there was an error callback provided we call it here
          opts.onError?.({ error, path, type, ctx, input });
          respond(ws, {
            id,
            jsonrpc,
            error: router.getErrorShape({
              error,
              type,
              path,
              input,
              ctx,
            }),
          });
        },
        complete() {
          respond(ws, {
            id,
            jsonrpc,
            result: {
              type: 'stopped',
            },
          });
        },
      });

      if (subscriptions.has(id)) {
        // duplicate request ids for client
        stopSubscription(ws, sub, { id, jsonrpc });
        throw new TRPCError({
          message: `Duplicate id ${id}`,
          code: 'BAD_REQUEST',
        });
      }
      subscriptions.set(id, sub);

      respond(ws, {
        id,
        jsonrpc,
        result: {
          type: 'started',
        },
      });
    } catch (cause) {
      // procedure threw an error
      const error = getTRPCErrorFromUnknown(cause);
      opts.onError?.({ error, path, type, ctx, input });
      respond(ws, {
        id,
        jsonrpc,
        error: router.getErrorShape({
          error,
          type,
          path,
          input,
          ctx,
        }),
      });
    }
  };
  return {
    onSocketOpen,
    onSocketMessage,
    onSocketClose,
    broadcastReconnectNotification: () => {
      const response: TRPCReconnectNotification = {
        id: null,
        method: 'reconnect',
      };
      const data = JSON.stringify(response);
      for(const client of websockets.keys()){
        client.send(data);
      }
    }
  };
}


function assertIsObject(obj: unknown): asserts obj is Record<string, unknown> {
  if (typeof obj !== 'object' || Array.isArray(obj) || !obj) {
    throw new Error('Not an object');
  }
}
function assertIsProcedureType(obj: unknown): asserts obj is ProcedureType {
  if (obj !== 'query' && obj !== 'subscription' && obj !== 'mutation') {
    throw new Error('Invalid procedure type');
  }
}
function assertIsRequestId(
  obj: unknown,
): asserts obj is number | string | null {
  if (
    obj !== null &&
    typeof obj === 'number' &&
    isNaN(obj) &&
    typeof obj !== 'string'
  ) {
    throw new Error('Invalid request id');
  }
}
function assertIsString(obj: unknown): asserts obj is string {
  if (typeof obj !== 'string') {
    throw new Error('Invalid string');
  }
}
function assertIsJSONRPC2OrUndefined(
  obj: unknown,
): asserts obj is '2.0' | undefined {
  if (typeof obj !== 'undefined' && obj !== '2.0') {
    throw new Error('Must be JSONRPC 2.0');
  }
}

function getMessageFromUnkownError(
  err: unknown,
  fallback: string,
): string {
  if (typeof err === 'string') {
    return err;
  }

  if (err instanceof Error && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

function getErrorFromUnknown(cause: unknown): Error {
  if (cause instanceof Error) {
    return cause;
  }
  const message = getMessageFromUnkownError(cause, 'Unknown error');
  return new Error(message);
}

function getTRPCErrorFromUnknown(cause: unknown): TRPCError {
  const error = getErrorFromUnknown(cause);
  // this should ideally be an `instanceof TRPCError` but for some reason that isn't working
  // ref https://github.com/trpc/trpc/issues/331
  if (error.name === 'TRPCError') {
    return cause as TRPCError;
  }

  const trpcError = new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    cause: error,
    message: error.message,
  });

  // Inherit stack from error
  trpcError.stack = error.stack;

  return trpcError;
}

function getCauseFromUnknown(cause: unknown) {
  if (cause instanceof Error) {
    return cause;
  }

  return undefined;
}


function transformTRPCResponseItem<
  TResponseItem extends TRPCResponse | TRPCResponseMessage,
>(router: AnyRouter, item: TResponseItem): TResponseItem {
  if ('error' in item) {
    return {
      ...item,
      error: router._def._config.transformer.output.serialize(item.error),
    };
  }

  if ('data' in item.result) {
    return {
      ...item,
      result: {
        ...item.result,
        data: router._def._config.transformer.output.serialize(
          item.result.data,
        ),
      },
    };
  }

  return item;
}

/**
 * Takes a unserialized `TRPCResponse` and serializes it with the router's transformers
 **/
function transformTRPCResponse<
  TResponse extends
  | TRPCResponse
  | TRPCResponse[]
  | TRPCResponseMessage
  | TRPCResponseMessage[],
>(router: AnyRouter, itemOrItems: TResponse) {
  return Array.isArray(itemOrItems)
    ? itemOrItems.map((item) => transformTRPCResponseItem(router, item))
    : transformTRPCResponseItem(router, itemOrItems);
}
