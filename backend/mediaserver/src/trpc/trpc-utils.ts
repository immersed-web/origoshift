import {observable, Observer} from '@trpc/server/observable';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';

//Internal utility types
type EmitterCallback<E extends ListenerSignature<E>, K extends keyof E> = E[K];
type EventArgument<E extends ListenerSignature<E>, K extends keyof E> = Parameters<EmitterCallback<E,K>>[0]
type AddFilterParam<FuncType extends (...args: any) => any, FilterType> = (...args: [...parameters: Parameters<FuncType>, filter: FilterType]) => ReturnType<FuncType>;
type AddFilterToEvents<IEvents extends ListenerSignature<IEvents>, FilterType> = {
  [K in keyof IEvents]: AddFilterParam<IEvents[K], FilterType>
}

export type EmitSignature<E extends ListenerSignature<E>> = TypedEmitter<E>['emit'];

export type NonFilteredEvents<E extends ListenerSignature<E>> = E
export type FilteredEvents<E extends {[K in keyof E]: (p: any) => void}, FilterType> = AddFilterToEvents<E, FilterType>

export function attachEmitter<E extends ListenerSignature<E>, K extends keyof E>(emitter: TypedEmitter<E>, event: K){
  return observable<EventArgument<E, typeof event>>(emit => {
    const onEvent  = (data: EventArgument<E,typeof event>): void => {
      // console.log('emitter triggered');
      emit.next(data);
    };

    emitter.on(event, onEvent as E[typeof event]);
    return () => {
      emitter.off(event, onEvent as E[typeof event]);
    };
  });
}

export function attachFilteredEmitter<E extends ListenerSignature<E>, K extends keyof E, FilterType>(emitter: TypedEmitter<E>, event: K, filter: FilterType){
  const myObservable = observable<EventArgument<E, typeof event>>(emit => {
    const onEvent  = (data: EventArgument<E,typeof event>, triggerId: FilterType): void => {
      if(triggerId === filter){
        console.log('skipping because emitter is filtered');
        return;
      }
      // console.log('emitter triggered:', event);
      emit.next(data);
    };

    emitter.on(event, onEvent as E[typeof event]);
    return () => {
      emitter.off(event, onEvent as E[typeof event]);
    };
  });
  return myObservable;
}
