import { createWorker, types as soupTypes} from 'mediasoup';
import config from '../mediasoupConfig';

const workerOptions = config.worker;
const numWorkers = config.numWorkers;

const workers: soupTypes.Worker[] = [];
export async function createWorkers(){
  for (let i = 0; i < numWorkers; i++) {
    const worker = await createWorker(workerOptions);

    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
  console.log(`Created ${numWorkers} mediasoup workers`);
}

/**
 * Get next mediasoup Worker.
 */
let nextMediasoupWorkerIdx = 0;
export function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];

  if (++nextMediasoupWorkerIdx === workers.length)
    nextMediasoupWorkerIdx = 0;

  return worker;
}