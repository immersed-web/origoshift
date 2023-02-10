import Venue from './classes/Venue';

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
