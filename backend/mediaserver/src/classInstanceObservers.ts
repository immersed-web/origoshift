import { TypedEmitter } from 'tiny-typed-emitter';
// import Client from 'classes/Client';
// import Venue from './classes/Venue';
import { Client, Venue } from './classes/InternalClasses';

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

export const printClientListeners = (clientList: Map<unknown, Client>) => {
  const printObj: Record<string, unknown> = {};
  for(const client of clientList.values()){
    const clientObj: Record<string, unknown> = {};
    const emitters: [string, TypedEmitter][] = [
      ['venuEvents', client.venueEvents],
      ['vrEvents', client.vrEvents],
    ];
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
    printObj[client.connectionId] = clientObj;
  }
  console.log(printObj);
};
