import type { AnyRouter, ProcedureType, inferRouterError } from '@trpc/server';
import { type Operation, type TRPCLink, TRPCClientError, type TRPCClientRuntime } from "@trpc/client";
import { type Observer, type UnsubscribeFn, observable } from '@trpc/server/observable';
import type {
  TRPCClientIncomingMessage,
  TRPCClientIncomingRequest,
  TRPCClientOutgoingMessage,
  TRPCRequestMessage,
  TRPCResponse,
  TRPCResponseMessage,
  TRPCResultMessage,
} from '@trpc/server/rpc';
// import { retryDelay } from '../internals/retryDelay';
// import { transformResult } from './internals/transformResult';
// import { Operation, TRPCLink } from './types';

export interface WebSocketClientOptions {
  url: string | (() => string);
  WebSocket?: typeof WebSocket;
  retryDelayMs?: typeof retryDelay;
  onOpen?: () => void;
  onClose?: (cause?: { code?: number }) => void;
}

export function createWSClient(opts: WebSocketClientOptions) {
  const {
    url,
    WebSocket: WebSocketImpl = WebSocket,
    retryDelayMs: retryDelayFn = retryDelay,
    onOpen,
    onClose,
  } = opts;
  /* istanbul ignore next */
  if (!WebSocketImpl) {
    throw new Error(
      "No WebSocket implementation found - you probably don't want to use this on the server, but if you do you need to pass a `WebSocket`-ponyfill",
    );
  }
  /**
   * outgoing messages buffer whilst not open
   */
  let outgoing: TRPCClientOutgoingMessage[] = [];
  /**
   * pending outgoing requests that are awaiting callback
   */
  type TCallbacks = WSCallbackObserver<AnyRouter, unknown>;
  type TRequest = {
    /**
     * Reference to the WebSocket instance this request was made to
     */
    ws: WebSocket;
    type: ProcedureType;
    callbacks: TCallbacks;
    op: Operation;
  };
  const pendingRequests: Record<number | string, TRequest> =
    Object.create(null);
  let connectAttempt = 0;
  let dispatchTimer: ReturnType<typeof setTimeout> | number | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | number | null = null;
  let activeConnection = createWS();
  let state: 'open' | 'connecting' | 'closed' = 'connecting';
  /**
   * tries to send the list of messages
   */
  function dispatch() {
    if (state !== 'open' || dispatchTimer) {
      return;
    }
    dispatchTimer = setTimeout(() => {
      dispatchTimer = null;

      if (outgoing.length === 1) {
        // single send
        activeConnection.send(JSON.stringify(outgoing.pop()));
      } else {
        // batch send
        activeConnection.send(JSON.stringify(outgoing));
      }
      // clear
      outgoing = [];
    });
  }
  function tryReconnect() {
    if (connectTimer || state === 'closed') {
      return;
    }
    const timeout = retryDelayFn(connectAttempt++);
    reconnectInMs(timeout);
  }
  function reconnect() {
    state = 'connecting';
    const oldConnection = activeConnection;
    activeConnection = createWS();
    closeIfNoPending(oldConnection);
  }
  function reconnectInMs(ms: number) {
    if (connectTimer) {
      return;
    }
    state = 'connecting';
    connectTimer = setTimeout(reconnect, ms);
  }

  function closeIfNoPending(conn: WebSocket) {
    // disconnect as soon as there are are no pending result
    const hasPendingRequests = Object.values(pendingRequests).some(
      (p) => p.ws === conn,
    );
    if (!hasPendingRequests) {
      conn.close();
    }
  }

  function resumeSubscriptionOnReconnect(req: TRequest) {
    if (outgoing.some((r) => r.id === req.op.id)) {
      return;
    }
    request(req.op, req.callbacks);
  }

  function createWS() {
    let urlString: string;
    if (typeof url === 'function'){
      urlString = url();
    } else{
      urlString = url;
    }
    const conn = new WebSocketImpl(urlString);
    clearTimeout(connectTimer as any);
    connectTimer = null;

    conn.addEventListener('open', () => {
      /* istanbul ignore next */
      if (conn !== activeConnection) {
        return;
      }
      connectAttempt = 0;
      state = 'open';
      onOpen?.();
      dispatch();
    });
    conn.addEventListener('error', () => {
      if (conn === activeConnection) {
        tryReconnect();
      }
    });
    const handleIncomingRequest = (req: TRPCClientIncomingRequest) => {
      if (req.method === 'reconnect' && conn === activeConnection) {
        if (state === 'open') {
          onClose?.();
        }
        reconnect();
        // notify subscribers
        for (const pendingReq of Object.values(pendingRequests)) {
          if (pendingReq.type === 'subscription') {
            resumeSubscriptionOnReconnect(pendingReq);
          }
        }
      }
    };
    const handleIncomingResponse = (data: TRPCResponseMessage) => {
      const req = data.id !== null && pendingRequests[data.id];
      if (!req) {
        // do something?
        return;
      }

      req.callbacks.next?.(data);
      if (req.ws !== activeConnection && conn === activeConnection) {
        const oldWs = req.ws;
        // gracefully replace old connection with this
        req.ws = activeConnection;
        closeIfNoPending(oldWs);
      }

      if (
        'result' in data &&
        data.result.type === 'stopped' &&
        conn === activeConnection
      ) {
        req.callbacks.complete();
      }
    };
    conn.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data) as TRPCClientIncomingMessage;

      if ('method' in msg) {
        handleIncomingRequest(msg);
      } else {
        handleIncomingResponse(msg);
      }
      if (conn !== activeConnection || state === 'closed') {
        // when receiving a message, we close old connection that has no pending requests
        closeIfNoPending(conn);
      }
    });

    conn.addEventListener('close', ({ code }) => {
      if (state === 'open') {
        onClose?.({ code });
      }

      if (activeConnection === conn) {
        // connection might have been replaced already
        tryReconnect();
      }

      for (const [key, req] of Object.entries(pendingRequests)) {
        if (req.ws !== conn) {
          continue;
        }

        if (state === 'closed') {
          // If the connection was closed, we just call `complete()` on the request
          delete pendingRequests[key];
          req.callbacks.complete?.();
          continue;
        }
        // The connection was closed either unexpectedly or because of a reconnect
        if (req.type === 'subscription') {
          // Subscriptions will resume after we've reconnected
          resumeSubscriptionOnReconnect(req);
        } else {
          // Queries and mutations will error if interrupted
          delete pendingRequests[key];
          req.callbacks.error?.(
            TRPCClientError.from(
              new TRPCWebSocketClosedError('WebSocket closed prematurely'),
            ),
          );
        }
      }
    });
    return conn;
  }

  function request(op: Operation, callbacks: TCallbacks): UnsubscribeFn {
    const { type, input, path, id } = op;
    const envelope: TRPCRequestMessage = {
      id,
      method: type,
      params: {
        input,
        path,
      },
    };
    pendingRequests[id] = {
      ws: activeConnection,
      type,
      callbacks,
      op,
    };

    // enqueue message
    outgoing.push(envelope);
    dispatch();

    return () => {
      const callbacks = pendingRequests[id]?.callbacks;
      delete pendingRequests[id];
      outgoing = outgoing.filter((msg) => msg.id !== id);

      callbacks?.complete?.();
      if (
        activeConnection.readyState === WebSocketImpl.OPEN &&
        op.type === 'subscription'
      ) {
        outgoing.push({
          id,
          method: 'subscription.stop',
        });
        dispatch();
      }
    };
  }
  return {
    close: () => {
      state = 'closed';
      onClose?.();
      closeIfNoPending(activeConnection);
      clearTimeout(connectTimer as any);
      connectTimer = null;
    },
    request,
    getConnection() {
      return activeConnection;
    },
  };
}
export type TRPCWebSocketClient = ReturnType<typeof createWSClient>;

export interface WebSocketLinkOptions {
  client: TRPCWebSocketClient;
}
class TRPCWebSocketClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TRPCWebSocketClosedError';
    Object.setPrototypeOf(this, TRPCWebSocketClosedError.prototype);
  }
}

class TRPCSubscriptionEndedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TRPCSubscriptionEndedError';
    Object.setPrototypeOf(this, TRPCSubscriptionEndedError.prototype);
  }
}

export function wsLink<TRouter extends AnyRouter>(
  opts: WebSocketLinkOptions,
): TRPCLink<TRouter> {
  return (runtime) => {
    const { client } = opts;
    return ({ op }) => {
      return observable((observer) => {
        const { type, path, id, context } = op;

        const input = runtime.transformer.serialize(op.input);

        let isDone = false;
        const unsub = client.request(
          { type, path, input, id, context },
          {
            error(err) {
              isDone = true;
              observer.error(err as TRPCClientError<any>);
              unsub();
            },
            complete() {
              if (!isDone) {
                isDone = true;
                observer.error(
                  TRPCClientError.from(
                    new TRPCSubscriptionEndedError(
                      'Operation ended prematurely',
                    ),
                  ),
                );
              } else {
                observer.complete();
              }
            },
            next(message) {
              const transformed = transformResult(message, runtime);

              if (!transformed.ok) {
                observer.error(TRPCClientError.from(transformed.error));
                return;
              }
              observer.next({
                result: transformed.result,
              });

              if (op.type !== 'subscription') {
                // if it isn't a subscription we don't care about next response

                isDone = true;
                unsub();
                observer.complete();
              }
            },
          },
        );
        return () => {
          isDone = true;
          unsub();
        };
      });
    };
  };
}

function transformResultInner<TRouter extends AnyRouter, TOutput>(
  response:
    | TRPCResponseMessage<TOutput, inferRouterError<TRouter>>
    | TRPCResponse<TOutput, inferRouterError<TRouter>>,
  runtime: TRPCClientRuntime,
) {
  if ('error' in response) {
    const error = runtime.transformer.deserialize(
      response.error,
    ) as inferRouterError<TRouter>;
    return {
      ok: false,
      error: {
        ...response,
        error,
      },
    } as const;
  }

  const result = {
    ...response.result,
    ...((!response.result.type || response.result.type === 'data') && {
      type: 'data',
      data: runtime.transformer.deserialize(response.result.data),
    }),
  } as TRPCResultMessage<TOutput>['result'];
  return { ok: true, result } as const;
}

function isObject(value: unknown): value is Record<string, unknown> {
  // check that value is object
  return !!value && !Array.isArray(value) && typeof value === 'object';
}

/**
 * Transforms and validates that the result is a valid TRPCResponse
 * @internal
 */
function transformResult<TRouter extends AnyRouter, TOutput>(
  response:
    | TRPCResponseMessage<TOutput, inferRouterError<TRouter>>
    | TRPCResponse<TOutput, inferRouterError<TRouter>>,
  runtime: TRPCClientRuntime,
): ReturnType<typeof transformResultInner> {
  let result: ReturnType<typeof transformResultInner>;
  try {
    // Use the data transformers on the JSON-response
    result = transformResultInner(response, runtime);
  } catch (err) {
    throw new TRPCClientError('Unable to transform response from server');
  }

  // check that output of the transformers is a valid TRPCResponse
  if (
    !result.ok &&
    (!isObject(result.error.error) ||
      typeof result.error.error.code !== 'number')
  ) {
    throw new TRPCClientError('Badly formatted response from server');
  }
  if (result.ok && !isObject(result.result)) {
    throw new TRPCClientError('Badly formatted response from server');
  }
  return result;
}


const retryDelay = (attemptIndex: number) =>
  attemptIndex === 0 ? 0 : Math.min(1000 * 2 ** attemptIndex, 30000);

type WSCallbackResult<TRouter extends AnyRouter, TOutput> = TRPCResponseMessage<
  TOutput,
  inferRouterError<TRouter>
>;

type WSCallbackObserver<TRouter extends AnyRouter, TOutput> = Observer<
  WSCallbackResult<TRouter, TOutput>,
  TRPCClientError<TRouter>
>;
