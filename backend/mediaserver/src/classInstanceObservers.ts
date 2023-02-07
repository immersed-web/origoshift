import Venue from './classes/Venue';


export default () => {
  const totalNrOf = {
    gatherings: 0,
    rooms: 0,
    clients: 0,
  };


  // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
  for( const [venueKey, venue] of Venue.venues.entries()) {
    totalNrOf.gatherings++;
    // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
    for(const [clientKey, client] of venue.clients.entries()) {
      totalNrOf.clients++;
    }
  }

  console.log('totalNrOf:', totalNrOf);
};
