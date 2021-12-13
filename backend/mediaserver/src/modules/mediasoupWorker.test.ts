import { createWorkers, getMediasoupWorker, tearDownAllSoupWorkers } from './mediasoupWorkers';


it('throws if no workers exist when requesting to get one', () => {
  expect(()=> getMediasoupWorker()).toThrow();
});

it('creates at least one soup worker', async () => {
  const numWorkersCreated = await createWorkers();
  // console.log(`created ${numWorkersCreated} workers`);
  expect(numWorkersCreated >= 1).toBeTruthy();

  tearDownAllSoupWorkers();
});

it('can create workers and then return worker when requested', async () => {
  await createWorkers();
  const worker = getMediasoupWorker();
  expect(worker).toBeTruthy();
  expect(worker.pid).toBeTruthy();

  tearDownAllSoupWorkers();
  
});