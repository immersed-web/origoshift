import { Log } from 'debug-level';
const log = new Log('Router:Soup');
process.env.DEBUG = 'Router:Soup*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { TRPCError } from '@trpc/server';
import {CreateProducerPayloadSchema, ConnectTransportPayloadSchema, ProducerId, RtpCapabilitiesSchema, CreateConsumerPayloadSchema, ProducerIdSchema, ConsumerId, ConsumerIdSchema } from 'schemas/mediasoup';
import { ErrorMapCtx, z } from 'zod';
import { procedure as p, clientInVenueP, router, userClientP, atLeastModeratorP, isUserClientM, isInCameraM } from '../trpc/trpc';
import { attachToEvent, attachToFilteredEvent, NotifierInputData } from '../trpc/trpc-utils';
import { CameraIdSchema } from 'schemas';
import { types as soupTypes } from 'mediasoup';
import type { UserClient } from 'classes/UserClient';
import type { SenderClient } from 'classes/SenderClient';
import { observable } from '@trpc/server/observable';
import { BaseClient } from 'classes/BaseClient';


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
    const client: UserClient | SenderClient = ctx.client;

    if(!client.sendTransport){
      throw new TRPCError({code:'PRECONDITION_FAILED', message:'sendTransport is undefined. Need a sendtransport to produce'});
    } else if(client.sendTransport.id !== input.transportId){
      throw new TRPCError({code: 'BAD_REQUEST', message:'the provided transporId didnt match the id of the sendTransport'});
    }
    const producerId = await client.createProducer(input);
    log.info('gonna emit producerCreated');
    // ctx.venue._notifyStateUpdated('producer added');
    ctx.venue._notifyAdminOnlyState('producer added');
    // ctx.venue.emitToAllClients('producerCreated', {producingConnectionId: ctx.connectionId, producer: {producerId, paused: input.producerInfo.isPaused, kind: input.kind}});
    // ctx.venue.emitToAllClients('someClientStateUpdated', { clientState: client.getPublicState(), reason: `client (${client.clientType}) created producer` });
    return producerId;
  }),
  closeVideoProducer: clientInVenueP.mutation(({ctx}) =>{
    if(!ctx.client.videoProducer){
      throw new TRPCError({code: 'NOT_FOUND', message: 'no videoProducer exists. can\t close'});
    }
    ctx.client.videoProducer.close();
    ctx.client.videoProducer = undefined;
  }),
  closeAudioProducer: clientInVenueP.mutation(({ctx}) =>{
    if(!ctx.client.audioProducer){
      throw new TRPCError({code: 'NOT_FOUND', message: 'no audioProducer exists. can\t close'});
    }
    ctx.client.audioProducer.close();
    ctx.client.audioProducer = undefined;
  }),
  closeProducer: clientInVenueP.input(z.object({producerId: ProducerIdSchema})).mutation(({input, ctx}) => {
    return 'Not implemented yet' as const;
  }),
  createConsumer: clientInVenueP.input(CreateConsumerPayloadSchema).mutation(async ({ctx, input}) => {
    log.info('received createConsumer request');
    const client = ctx.client;
    if(!client.receiveTransport){
      throw new TRPCError({code:'PRECONDITION_FAILED', message:'A transport is required to create a consumer'});
    }

    if(!client.rtpCapabilities){
      throw Error('rtpCapabilities of client unknown. Provide them before requesting to consume');
    }
    const producerId = input.producerId;
    return await ctx.client.createConsumer({producerId});
  }),
  pauseOrResumeConsumer: p.input(z.object({
    producerId: ProducerIdSchema,
    pause: z.boolean(),
  })).mutation(({ctx, input}) => {
    const consumer = ctx.client.consumers.get(input.producerId);
    if(!consumer) {
      throw new TRPCError({code: 'NOT_FOUND', message: 'no consumer witht that id found'});
    }
    if(input.pause){
      consumer.pause();
    } else {
      consumer.resume();
    }
  }),
  subSoupObjectClosed: p.subscription(({ctx}) => {
    log.info(`client (${ctx.clientType}) ${ctx.username} (${ctx.connectionId}) started susbscribing to soupObjectClosed`);
    return observable<NotifierInputData<typeof ctx.client.notify.soupObjectClosed>>(scriber =>{
      log.info(ctx.client.notify);
      ctx.client.notify['soupObjectClosed'] = (d) => {
        log.info(`soupObject ${d.data.type} closed triggered for client ${ctx.username} (${ctx.clientType})`);
        scriber.next(d);
      };
      log.info(ctx.client.notify);
      return () => {
        ctx.client.notify.soupObjectClosed = undefined;
      };
    });
  })
});
