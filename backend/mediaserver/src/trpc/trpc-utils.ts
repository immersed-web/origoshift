import {observable, Observer} from '@trpc/server/observable';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';

import { Log } from 'debug-level';
const log = new Log('TRPCUtils');
process.env.DEBUG = 'TRPCUtils*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

//Internal utility types
type ListenerFunction<Arg = any> = (data: Arg) => void
type FilteredListenerFunction<Filter, Arg = any> = (data: Arg, filter: Filter) => void
type SingleParamListenerSignature<L> = { [E in keyof L]: ListenerFunction }
type FilteredListenerSignature<L, Filter> = { [E in keyof L]: FilteredListenerFunction<Filter> }

type PickUnfilteredEvents<E extends ListenerSignature<E>> = {
  [K in keyof E as E[K] extends ListenerFunction ? K : never]: E[K]
}
type UnfilteredEventTypes<E extends ListenerSignature<E>> = keyof PickUnfilteredEvents<E>
type PickFilteredEvents<E extends ListenerSignature<E>> = Omit<E, keyof PickUnfilteredEvents<E>>
type FilteredEventTypes<E extends ListenerSignature<E>> = keyof PickFilteredEvents<E>

type EmitterCallback<E extends ListenerSignature<E>, K extends keyof E> = E[K];
type EventData<E extends ListenerSignature<E>, K extends keyof E> = Parameters<EmitterCallback<E,K>>[0]
type AddFilterParam<FuncType extends ListenerFunction, FilterType> = (data: Parameters<FuncType>[0], filter: FilterType) => ReturnType<FuncType>;
type AddFilterToEvents<IEvents extends SingleParamListenerSignature<IEvents>, FilterType> = {
  [K in keyof IEvents]: AddFilterParam<IEvents[K], FilterType>
}

type FilterType<E extends ListenerSignature<E>, K extends FilteredEventTypes<E>> = Parameters<EmitterCallback<PickFilteredEvents<E>, K>>[1]

export type EmitSignature<E extends ListenerSignature<E>> = TypedEmitter<E>['emit'];

export type NonFilteredEvents<E extends SingleParamListenerSignature<E>> = E
export type FilteredEvents<E extends SingleParamListenerSignature<E>, FilterType> = AddFilterToEvents<E, FilterType>

export function attachEmitter<E extends ListenerSignature<E>, K extends UnfilteredEventTypes<E>, Data extends EventData<E, K>, TransformedResult = Data>(emitter: TypedEmitter<E>, event: K, transformer?: (data: Data) => TransformedResult){
  return observable<TransformedResult>(emit => {
    const onEvent  = (data: Data): void => {
      log.info('emitter triggered:', event);

      if(transformer){
        const td = transformer(data);
        emit.next(td);
        return;
      }
      emit.next(data);
    };

    emitter.on(event, onEvent as E[typeof event]);
    return () => {
      emitter.off(event, onEvent as E[typeof event]);
    };
  });
}


// type MyEvents = FilteredEvents<{
//   'filtered': (data: {msg: string}) => void,
//   'moarzrFiltered': (data: number) => void,
// }, number> & NonFilteredEvents<{
//   'unfiltered': (data: {greeting: string}) => void
//   'coolEvent': (data: {info: number, meta: string}) => void
// }>

// const te : TypedEmitter<MyEvents> = new TypedEmitter();
// const obsvble = attachEmitter(te, 'coolEvent', (data) => ({...data, hello: 'world'}));
// obsvble.subscribe({
//   next(value) {
//     console.log(value);
//   },
// });



export function attachFilteredEmitter<E extends ListenerSignature<E>, K extends keyof E, Data extends EventData<E, K>, TransformedResult = Data>(emitter: TypedEmitter<E>, event: FilteredEventTypes<E>, filter: FilterType<E, typeof event>, transformer?: (data: Data) => TransformedResult){
  const myObservable = observable<TransformedResult>(emit => {
    const onEvent: FilteredListenerFunction<typeof filter, Data> = (data, triggerId)=> {
      if(triggerId === filter){
        log.info('skipping because emitter is filtered');
        return;
      }
      log.info('emitter triggered:', event);
      if(transformer){
        emit.next(transformer(data));
        return;
      }
      emit.next(data);
    };

    emitter.on(event, onEvent as E[typeof event]);
    return () => {
      emitter.off(event, onEvent as E[typeof event]);
    };
  });
  return myObservable;
}

// const fltobsvble = attachFilteredEmitter(te, 'moarzrFiltered', 123, (data) => ('hejsan' as const) );

// fltobsvble.subscribe({
//   next(value) {
//     console.log(value);
//   },
// });
