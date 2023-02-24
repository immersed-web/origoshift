// import mediasoup from 'mediasoup';
import {observer, types as mediasoupTypes} from 'mediasoup';
import { Log } from 'debug-level';

const log = new Log('mediasoup:Observers');
process.env.DEBUG = 'medisoup:Observers, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

export default function () {

  // console.log('is observerLogger enabled? ', observerLog.enabled);

  const totalNrOf = {
    workers: 0,
    routers: 0,
    transports: 0,

    producers: 0,
    Dataproducers: 0,

    consumers: 0,
    dataConsumers: 0,
  };
  // setInterval(() => {
  //   log.info('totalNrOf: ',totalNrOf);
  // }, 8000);

  observer.on('newworker', (worker: mediasoupTypes.Worker) =>
  {
    log.info('new worker created [worker.pid:%d]', worker.pid);
    totalNrOf.workers++;

    worker.observer.on('close', () =>
    {
      log.info('worker closed [worker.pid:%d]', worker.pid);
      totalNrOf.workers--;
    });

    worker.observer.on('newrouter', (router: mediasoupTypes.Router) =>
    {
      log.info(
        'new router created [worker.pid:%d, router.id:%s]',
        worker.pid, router.id);
      totalNrOf.routers++;

      router.observer.on('close', () =>
      {
        log.info('router closed [router.id:%s]', router.id);
        totalNrOf.routers--;
      });

      router.observer.on('newtransport', (transport: mediasoupTypes.Transport) =>
      {
        log.info(
          'new transport created [worker.pid:%d, router.id:%s, transport.id:%s]',
          worker.pid, router.id, transport.id);
        totalNrOf.transports++;

        transport.observer.on('close', () =>
        {
          log.info('transport closed [transport.id:%s]', transport.id);
          totalNrOf.transports--;
        });

        transport.observer.on('newproducer', (producer: mediasoupTypes.Producer) =>
        {
          log.info(
            'new producer created [worker.pid:%d, router.id:%s, transport.id:%s, producer.id:%s]',
            worker.pid, router.id, transport.id, producer.id);
          totalNrOf.producers++;

          producer.observer.on('close', () =>
          {
            log.info('producer closed [producer.id:%s]', producer.id);
            totalNrOf.producers--;
          });
        });

        transport.observer.on('newconsumer', (consumer: mediasoupTypes.Consumer) =>
        {
          log.info(
            'new consumer created [worker.pid:%d, router.id:%s, transport.id:%s, consumer.id:%s]',
            worker.pid, router.id, transport.id, consumer.id);
          totalNrOf.consumers++;

          consumer.observer.on('close', () =>
          {
            log.info('consumer closed [consumer.id:%s]', consumer.id);
            totalNrOf.consumers--;
          });
        });

        transport.observer.on('newdataproducer', (dataProducer: mediasoupTypes.DataProducer) =>
        {
          log.info(
            'new data producer created [worker.pid:%d, router.id:%s, transport.id:%s, dataProducer.id:%s]',
            worker.pid, router.id, transport.id, dataProducer.id);
          totalNrOf.Dataproducers++;

          dataProducer.observer.on('close', () =>
          {
            log.info('data producer closed [dataProducer.id:%s]', dataProducer.id);
            totalNrOf.Dataproducers--;
          });
        });

        transport.observer.on('newdataconsumer', (dataConsumer: mediasoupTypes.DataConsumer) =>
        {
          log.info(
            'new data consumer created [worker.pid:%d, router.id:%s, transport.id:%s, dataConsumer.id:%s]',
            worker.pid, router.id, transport.id, dataConsumer.id);
          totalNrOf.dataConsumers++;

          dataConsumer.observer.on('close', () =>
          {
            console.log('data consumer closed [dataConsumer.id:%s]', dataConsumer.id);
            totalNrOf.dataConsumers--;
          });
        });
      });
    });
  });

  const print = () => log.info('totalNrOf:', totalNrOf);

  return print;
}
