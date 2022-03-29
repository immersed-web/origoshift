// import mediasoup from 'mediasoup';
import {observer, types as mediasoupTypes} from 'mediasoup';
// import { debuglog } from 'util';
import debug from 'debug';

export default () => {

  const observerLog = debug('mediasoup:Observers');
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
  //   observerLog('totalNrOf: ',totalNrOf);
  // }, 8000);

  observer.on('newworker', (worker: mediasoupTypes.Worker) =>
  {
    observerLog('new worker created [worker.pid:%d]', worker.pid);
    totalNrOf.workers++;

    worker.observer.on('close', () => 
    {
      observerLog('worker closed [worker.pid:%d]', worker.pid);
      totalNrOf.workers--;
    });

    worker.observer.on('newrouter', (router: mediasoupTypes.Router) =>
    {
      observerLog(
        'new router created [worker.pid:%d, router.id:%s]',
        worker.pid, router.id);
      totalNrOf.routers++;

      router.observer.on('close', () => 
      {
        observerLog('router closed [router.id:%s]', router.id);
        totalNrOf.routers--;
      });

      router.observer.on('newtransport', (transport: mediasoupTypes.Transport) =>
      {
        observerLog(
          'new transport created [worker.pid:%d, router.id:%s, transport.id:%s]',
          worker.pid, router.id, transport.id);
        totalNrOf.transports++;

        transport.observer.on('close', () => 
        {
          observerLog('transport closed [transport.id:%s]', transport.id);
          totalNrOf.transports--;
        });

        transport.observer.on('newproducer', (producer: mediasoupTypes.Producer) =>
        {
          observerLog(
            'new producer created [worker.pid:%d, router.id:%s, transport.id:%s, producer.id:%s]',
            worker.pid, router.id, transport.id, producer.id);
          totalNrOf.producers++;

          producer.observer.on('close', () => 
          {
            observerLog('producer closed [producer.id:%s]', producer.id);
            totalNrOf.producers--;
          });
        });

        transport.observer.on('newconsumer', (consumer: mediasoupTypes.Consumer) =>
        {
          observerLog(
            'new consumer created [worker.pid:%d, router.id:%s, transport.id:%s, consumer.id:%s]',
            worker.pid, router.id, transport.id, consumer.id);
          totalNrOf.consumers++;

          consumer.observer.on('close', () => 
          {
            observerLog('consumer closed [consumer.id:%s]', consumer.id);
            totalNrOf.consumers--;
          });
        });

        transport.observer.on('newdataproducer', (dataProducer: mediasoupTypes.DataProducer) =>
        {
          observerLog(
            'new data producer created [worker.pid:%d, router.id:%s, transport.id:%s, dataProducer.id:%s]',
            worker.pid, router.id, transport.id, dataProducer.id);
          totalNrOf.Dataproducers++;

          dataProducer.observer.on('close', () => 
          {
            observerLog('data producer closed [dataProducer.id:%s]', dataProducer.id);
            totalNrOf.Dataproducers--;
          });
        });

        transport.observer.on('newdataconsumer', (dataConsumer: mediasoupTypes.DataConsumer) =>
        {
          observerLog(
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

  const print = () => observerLog('totalNrOf:', totalNrOf);

  return print;
};