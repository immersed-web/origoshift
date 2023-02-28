import { TypedEmitter } from 'tiny-typed-emitter';
import { Connection, SenderClient, UserClient, Venue } from './classes/InternalClasses';

import { Log } from 'debug-level';
const log = new Log('ClassObserver');
process.env.DEBUG = 'ClassObserver*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);
//
// @ts-expect-error: We allow reading private field here
type venueDict = typeof Venue.venues extends Map<infer K, any>?Record<K, number>:never

export default (clientList: Map<any, any>) => {
  const totalNrOf = {
    nrOfClients: clientList.size,
    nrOfVenues: 0,
    venueClients: {} as venueDict    // cameras: 0,
  };

  // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
  for( const [venueKey, venue] of Venue.venues.entries()) {
    totalNrOf.nrOfVenues++;
    totalNrOf.venueClients[venueKey] = 0;
    // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
    for(const [clientKey, client] of venue.clients.entries()) {
      totalNrOf.venueClients[venueKey]++;
    }
  }

  console.log('totalNrOf:', totalNrOf);
};

export const printClientListeners = (clientList: Map<unknown, Connection>) => {
  const printObj: Record<string, unknown> = {};
  for(const connection of clientList.values()){
    const client = connection.client;
    if(!client){
      log.warn(`connection ${connection.connectionId} (${connection.jwtUserData.username}) didnt have a client created/referenced`);
      continue;
    }
    const clientObj: Record<string, unknown> = {};
    let emitters: [string, TypedEmitter][];
    if(client instanceof UserClient){
      emitters = [
        ['venuEvents', client.venueEvents],
        ['vrEvents', client.vrEvents],
      ];
    } else if(client instanceof SenderClient){
      emitters = [
        ['senderEvents', client.senderEvents],
      ];
    } else {
      log.warn('Not matching client instance type when trying to print listener stats');
      continue;
    }
    // const  = Object.getOwnPropertyNames(client);
    for(const [emitterName, emitter] of emitters) {
      // let nrListeners = 0;
      const emitterObj: Record<string, number> = {};
      for(const type of emitter.eventNames()){
        // nrListeners += emitter.listenerCount(type);
        emitterObj[type] = emitter.listenerCount(type);
      }
      clientObj[emitterName] = emitterObj;
    }
    printObj[connection.connectionId] = clientObj;
  }
  console.log(printObj);
};
