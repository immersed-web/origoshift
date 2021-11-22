import Gathering from './Gathering';
import { types } from 'mediasoup';

beforeEach(() => {
  // @ts-expect-error we want a fresh set for each test!!!
  Gathering.gatherings.clear();
});

describe('When creating a gathering it', ()=> {
  it('autogenerates a UUID if not provided', async () => {
    const gathering = await Gathering.createGathering();
    expect(gathering.id).toBeDefined();
  });
  it('uses a custom UUID if provided', async () =>{
    const customUuid = 'asdf34grhg4j5';
    const gathering =  await Gathering.createGathering(customUuid);
    expect(gathering.id).toBe(customUuid);
  });
  it('adds itself to the global set of gatherings', async () => {
    const gathering = await Gathering.createGathering();
    const gatheringId = gathering.id;
    expect(Gathering.getGathering(gatheringId)).toBe(gathering);
  });
  it('doesnt allow creating a gathering with an already taken id', async () => {
    // @ts-expect-error we allow private access for tests
    const allGatherings = Gathering.gatherings;
    
    console.log('Gathering set:', allGatherings);
    const notUniqueId = 'gunnarärbäst';
    await Gathering.createGathering(notUniqueId);
    // const gathering2 = new Gathering(notUniqueId);
    const createFunction = async () => {await Gathering.createGathering(notUniqueId);};
    expect(createFunction).rejects.toThrow();
    // expect(gathering2).toBeUndefined();
    const nrOfGatherings = allGatherings.size;
    expect(nrOfGatherings).toBe(1);
  });
});