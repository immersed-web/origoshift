import { Log } from 'debug-level';
const log = new Log('Soup:Router');
process.env.DEBUG = 'Soup:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { TRPCError } from '@trpc/server';
import {CreateProducerPayloadSchema, ConnectTransportPayloadSchema, ProducerId, RtpCapabilitiesSchema } from 'schemas/mediasoup';
import { z } from 'zod';
import { procedure as p, clientInVenueP, router } from '../trpc/trpc';
import { attachEmitter } from '../trpc/trpc-utils';
// import { Producer as SoupProducer } from 'mediasoup/node/lib/Producer';
// import '../augmentedMediasoup';
// import { attachFilteredEmitter, FilteredEvents } from '../trpc/trpc-utils';


export const soupRouter = router({
  getRouterRTPCapabilities: clientInVenueP.query(({ctx}) => {

    const caps = ctx.venue.router.rtpCapabilities;
    return caps;
    // return 'Not implemented yet' as const;
  }),
  setRTPCapabilities: clientInVenueP.input(z.object({rtpCapabilities: RtpCapabilitiesSchema})).mutation(({input, ctx}) => {
    ctx.client.rtpCapabilities = input.rtpCapabilities;
    log.debug(`clint ${ctx.username} (${ctx.connectionId}) changed rtpCapabilities to: `, input.rtpCapabilities);
    // return 'Not implemented yet' as const;
  }),
  createSendTransport: clientInVenueP.mutation(async ({ctx}) => {
    return await ctx.client.createWebRtcTransport('send');
  }),
  createReceiveTransport: clientInVenueP.mutation(async ({ctx}) => {
    return await ctx.client.createWebRtcTransport('receive');
  }),
  connectTransport: clientInVenueP.input(ConnectTransportPayloadSchema).mutation(async ({ctx, input}) => {
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
  createProducer: clientInVenueP.input(CreateProducerPayloadSchema).mutation(async ({ctx, input}) => {
    log.info('received createProducer request!');
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
      client.producers.delete(producer.id as ProducerId);
      client.soupEvents.emit('soupObjectClosed', {type: 'producer', id: producer.id as ProducerId, reason: 'transport was closed'});
    });
    client.producers.set(producer.id as ProducerId, producer);

    return producer.id;
  }),
  closeProducer: clientInVenueP.input(z.object({producerId:z.string().uuid()})).mutation(({input, ctx}) => {
    return 'Not implemented yet' as const;
  }),
  onProducerClosed: clientInVenueP.input(z.string().uuid()).subscription(({input, ctx}) => {
    return 'Not implemented yet' as const;
    // return attachFilteredEmitter(ee, 'producerClosed', ctx.uuid);
  }),
  subSoupObjectClosed: p.subscription(({ctx}) => {
    return attachEmitter(ctx.client.soupEvents, 'soupObjectClosed');
    // return 'Not implemented yet' as const;
  })
});
