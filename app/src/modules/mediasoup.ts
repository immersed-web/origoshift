import {Device, types as soupTypes} from 'mediasoup-client';
import type { ProducerId, TransportId, CreateProducerPayload } from 'schemas/mediasoup';
export const soupDevice = new Device();


type ConnectTransportFunction = (data: {transportId: TransportId, dtlsParameters: soupTypes.DtlsParameters}) => Promise<void>
type CreateProducerFunction = (data: CreateProducerPayload) => Promise<ProducerId>

export const attachTransportEvents = (transport: soupTypes.Transport, connectTransport: ConnectTransportFunction, createProducer: CreateProducerFunction) => {
  transport.on('connect', async ({dtlsParameters}, callback, errback) => {
    console.log('transport connect event trigered!');
    // void (async () => {
    // const connectTransportReq = createRequest('connectTransport', {
    //   transportId: transport.id,
    //   dtlsParameters,
    // });
    // const response = await socketutils.sendRequest(connectTransportReq);
    try{
      await connectTransport({transportId: transport.id as TransportId, dtlsParameters});
      callback();
      return;
    } catch(e) {
      errback(e as Error);
    }
    // })();
  });

  if (transport.direction === 'send') {
    transport.on('produce', async ({
      kind,
      rtpParameters,
      appData,
    }, callback, errorback) => {
      console.log('transport produce event triggered!', {kind, rtpParameters, appData});
      try {
        // const { producerInfo } = appData;
        // // const response = await this.socket.request('createProducer', { transportId: transport.id, kind, rtpParameters });
        // const createProducerReq = createRequest('createProducer', {
        //   kind,
        //   rtpParameters,
        //   transportId: transport.id,
        //   producerInfo,
        // });
        // const response = await socketutils.sendRequest(createProducerReq);
        const { producerInfo, producerId } = appData as Pick<CreateProducerPayload, 'producerId' | 'producerInfo'>;

        const createdProducerId = await createProducer({transportId: transport.id as TransportId, producerId, kind, rtpParameters, producerInfo});
        // if (response.wasSuccess) {
        //   const cbData = {
        //     id: response.data.producerId,
        //   };
        callback({ id: createdProducerId });
        return;
      } catch (err) {
        errorback(err as Error);
      }
    });
  }

  transport.on('connectionstatechange', (state) => {
    console.log(`transport (${transport.id}) connection state changed to: `, state);
    switch (state) {
      case 'connecting':
        break;
      case 'connected':
        break;
      case 'failed':
        console.error('transport connectionstatechange failed');
        transport.close();
        break;
      default:
        break;
    }
  });
};
