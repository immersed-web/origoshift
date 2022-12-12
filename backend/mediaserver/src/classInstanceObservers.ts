import Gathering from './classes/Gathering';


export default () => {
  const totalNrOf = {
    gatherings: 0,
    rooms: 0,
    clients: 0,
  };

  
  // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
  for( const [gatheringKey, gathering] of Gathering.gatherings.entries()) {
    totalNrOf.gatherings++;
    // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
    for(const [clientKey, client] of gathering.clients.entries()) {
      totalNrOf.clients++;
    }

    // @ts-expect-error: In ooonly this specific case we want to ignore the private field (ws). But never elsewhere
    for(const [roomKey, room] of gathering.rooms.entries()) {
      totalNrOf.rooms++;
    }
  }

  console.log('totalNrOf:', totalNrOf);
};