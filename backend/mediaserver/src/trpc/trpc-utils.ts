/* eslint-disable @typescript-eslint/no-explicit-any */
import {observable } from '@trpc/server/observable';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';

import { Log } from 'debug-level';
const log = new Log('TRPCUtils');
process.env.DEBUG = 'TRPCUtils*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

//Internal utility types

type MakeParamsRequired<Func extends (args: any) => any> = (...args:Required<Parameters<Func>>) => ReturnType<Func>

type ListenerFunction<Arg = any> = (data: Arg) => void
type FilteredListenerFunction<Filter, Arg = any> = (data: Arg, filter: Filter) => void
export type SingleParamListenerSignature<L> = { [E in keyof L]: ListenerFunction }
export type FilteredListenerSignature<L, Filter> = { [E in keyof L]: FilteredListenerFunction<Filter> }

export type CustomListenerSignature<L> = { [E in keyof L]: (data: any, filter?: any) => void }


type PickUnfilteredEvents<E extends ListenerSignature<E>> = {
  [K in keyof E as MakeParamsRequired<E[K]> extends ListenerFunction ? K : never]: E[K]
}
type UnfilteredEventTypes<E extends ListenerSignature<E>> = keyof PickUnfilteredEvents<E>
type PickFilteredEvents<E extends ListenerSignature<E>> = Omit<E, keyof PickUnfilteredEvents<E>>
type FilteredEventTypes<E extends ListenerSignature<E>> = keyof PickFilteredEvents<E>

type EmitterCallback<E extends ListenerSignature<E>, K extends keyof E> = E[K];
type EventData<E extends ListenerSignature<E>, K extends keyof E> = Parameters<EmitterCallback<E,K>>[0]
type AddFilterParam<FuncType extends ListenerFunction, FilterType> = (data: Parameters<FuncType>[0], filter?: FilterType) => ReturnType<FuncType>;
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


type MyEvents = FilteredEvents<{
  'filtered': (data: {msg: string}) => void,
  'moarzrFiltered': (data: number) => void,
}, number> & NonFilteredEvents<{
  'unfiltered': (data: {greeting: string}) => void
  'coolEvent': (data: {info: number, meta: string}) => void
}>

const te : TypedEmitter<MyEvents> = new TypedEmitter();
te.emit('moarzrFiltered', 123);
const obsvble = attachEmitter(te, 'coolEvent', (data) => ({...data, hello: 'world'}));
obsvble.subscribe({
  next(value) {
    console.log(value);
  },
});


te.emit('moarzrFiltered', 123, undefined);
const fltobsvble = attachFilteredEmitter(te, 'moarzrFiltered', () => 1+1 == 2, (d) => d+1);

fltobsvble.subscribe({
  next(value) {
    console.log(value);
  },
});

export function attachFilteredEmitter<E extends ListenerSignature<E>, K extends FilteredEventTypes<E>, Data extends EventData<E, K>, TransformedResult = Data>(emitter: TypedEmitter<E>, event: K, filter: Exclude<FilterType<E, typeof event>, undefined> | ((data: Data) => boolean), transformer?: (data: Data) => TransformedResult){
  const myObservable = observable<TransformedResult>(emit => {
    const onEvent: FilteredListenerFunction<typeof filter, Data> = (data, triggerId)=> {
      if(typeof filter === 'function'){
        if(!filter(data)){
          log.info('skipping because emitter is filtered');
          return;
        }
      }
      if(triggerId !== undefined && triggerId === filter){
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

