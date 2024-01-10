import { Log } from 'debug-level';

const log = new Log('Stats:Mediasoup');
process.env.DEBUG = 'Stats:Mediasoup*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

const observerLog = new Log('Observers:Mediasoup');
process.env.DEBUG = 'Observers:Mediasoup*, ' + process.env.DEBUG;
observerLog.enable(process.env.DEBUG);

import {observer, types as mediasoupTypes} from 'mediasoup';

export function attachMediasoupObservers () {

  // console.log('is observerLogger enabled? ', log.enabled);

  const totalNrOf = {
    workers: 0,
    routers: 0,
    transports: 0,

    producers: 0,
    dataProducers: 0,

    consumers: 0,
    dataConsumers: 0,
  };
  // setInterval(() => {
  //   log.info('totalNrOf: ',totalNrOf);
  // }, 8000);

  observer.on('newworker', (worker: mediasoupTypes.Worker) =>
  {
    observerLog.info('new worker created [worker.pid:%d]', worker.pid);
    totalNrOf.workers++;

    worker.observer.on('close', () =>
    {
      observerLog.info('worker closed [worker.pid:%d]', worker.pid);
      totalNrOf.workers--;
    });

    worker.observer.on('newrouter', (router: mediasoupTypes.Router) =>
    {
      observerLog.info(
        'new router created [worker.pid:%d, router.id:%s]',
        worker.pid, router.id);
      totalNrOf.routers++;

      router.observer.on('close', () =>
      {
        observerLog.info('router closed [router.id:%s]', router.id);
        totalNrOf.routers--;
      });

      router.observer.on('newtransport', (transport: mediasoupTypes.Transport) =>
      {
        observerLog.info(
          'new transport created [worker.pid:%d, router.id:%s, transport.id:%s]',
          worker.pid, router.id, transport.id);
        totalNrOf.transports++;

        transport.observer.on('close', () =>
        {
          observerLog.info('transport closed [transport.id:%s]', transport.id);
          totalNrOf.transports--;
        });

        transport.observer.on('newproducer', (producer: mediasoupTypes.Producer) =>
        {
          observerLog.info(
            'new producer created [worker.pid:%d, router.id:%s, transport.id:%s, producer.id:%s]',
            worker.pid, router.id, transport.id, producer.id);
          totalNrOf.producers++;

          producer.observer.on('close', () =>
          {
            observerLog.info('producer closed [producer.id:%s]', producer.id);
            totalNrOf.producers--;
          });
        });

        transport.observer.on('newconsumer', (consumer: mediasoupTypes.Consumer) =>
        {
          observerLog.info(
            'new consumer created [worker.pid:%d, router.id:%s, transport.id:%s, consumer.id:%s]',
            worker.pid, router.id, transport.id, consumer.id);
          totalNrOf.consumers++;

          consumer.observer.on('close', () =>
          {
            observerLog.info('consumer closed [consumer.id:%s]', consumer.id);
            totalNrOf.consumers--;
          });
        });

        transport.observer.on('newdataproducer', (dataProducer: mediasoupTypes.DataProducer) =>
        {
          observerLog.info(
            'new data producer created [worker.pid:%d, router.id:%s, transport.id:%s, dataProducer.id:%s]',
            worker.pid, router.id, transport.id, dataProducer.id);
          totalNrOf.dataProducers++;

          dataProducer.observer.on('close', () =>
          {
            observerLog.info('data producer closed [dataProducer.id:%s]', dataProducer.id);
            totalNrOf.dataProducers--;
          });
        });

        transport.observer.on('newdataconsumer', (dataConsumer: mediasoupTypes.DataConsumer) =>
        {
          observerLog.info(
            'new data consumer created [worker.pid:%d, router.id:%s, transport.id:%s, dataConsumer.id:%s]',
            worker.pid, router.id, transport.id, dataConsumer.id);
          totalNrOf.dataConsumers++;

          dataConsumer.observer.on('close', () =>
          {
            observerLog.info('data consumer closed [dataConsumer.id:%s]', dataConsumer.id);
            totalNrOf.dataConsumers--;
          });
        });
      });
    });
  });

  const print = () => log.info('totalNrOf:', totalNrOf);

  return print;
}
