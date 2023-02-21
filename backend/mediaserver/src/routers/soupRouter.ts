import { TRPCError } from '@trpc/server';
import {CreateProducerPayloadSchema, ConnectTransportPayloadSchema } from 'schemas/mediasoup';
import { z } from 'zod';
import { procedure as p, router } from '../trpc/trpc';
// import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';


export const soupRouter = router({
  getRouterRTPCapabilities: p.query(() => {
    return 'Not implemented yet' as const;
  }),
  setRTPCapabilities: p.query(() => {
    return 'Not implemented yet' as const;
  }),
  connectTransport: p.input(ConnectTransportPayloadSchema).mutation(async ({ctx, input}) => {
    const client = ctx.client;
    const transportId = input.transportId;
    const dtlsParameters = input.dtlsParameters;
    let chosenTransport;

    if(transportId === client.receiveTransport?.id){
      chosenTransport = client.receiveTransport;
    } else if(transportId === client.sendTransport?.id){
      chosenTransport = client.sendTransport;
    } else{
      throw new TRPCError({code: 'NOT_FOUND', message:'no transport with that id on server-side'});
    }
    await chosenTransport.connect({dtlsParameters});
  }),
  createProducer: p.input(CreateProducerPayloadSchema).mutation(async ({ctx, input}) => {
    const client = ctx.client;

    if(!client.sendTransport){
      throw new TRPCError({code:'PRECONDITION_FAILED', message:'sendTransport is undefined. Need a sendtransport to produce'});
    } else if(client.sendTransport.id !== input.transportId){
      throw new TRPCError({code: 'BAD_REQUEST', message:'the provided transporId didnt match the id of the sendTransport'});
    }
    const {kind, rtpParameters, producerInfo} = input;
    const appData = { producerInfo };
    const producer = await client.sendTransport.produce({ kind, rtpParameters, appData});
    producer.on('transportclose', () => {
      console.log(`transport for producer ${producer.id} was closed`);
      client.producers.delete(producer.id);
      client.soupEvents.emit('producerClosed', producer.id);
    });
    client.producers.set(producer.id, producer);

    return producer.id;
  }),
  closeProducer: p.input(z.object({producerId:z.string().uuid()})).mutation(({input, ctx}) => {
    return 'Not implemented yet' as const;
  }),
  onProducerClosed: p.input(z.string().uuid()).subscription(({input, ctx}) => {
    return 'Not implemented yet' as const;
    // return attachFilteredEmitter(ee, 'producerClosed', ctx.uuid);
  })
});
