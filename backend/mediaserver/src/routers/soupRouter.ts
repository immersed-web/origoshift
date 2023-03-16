import { Log } from 'debug-level';
const log = new Log('Soup:Router');
process.env.DEBUG = 'Soup:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { TRPCError } from '@trpc/server';
import {CreateProducerPayloadSchema, ConnectTransportPayloadSchema, ProducerId, RtpCapabilitiesSchema, CreateConsumerPayloadSchema, ProducerIdSchema } from 'schemas/mediasoup';
import { z } from 'zod';
import { procedure as p, clientInVenueP, router } from '../trpc/trpc';
import { attachEmitter, attachFilteredEmitter } from '../trpc/trpc-utils';
import { CameraIdSchema } from 'schemas';
import { types as soupTypes } from 'mediasoup';
import type { UserClient } from 'classes/UserClient';
import type { SenderClient } from 'classes/SenderClient';

export const soupRouter = router({
  getRouterRTPCapabilities: clientInVenueP.query(({ctx}) => {

    const caps = ctx.venue.router.rtpCapabilities;
    return caps;
    // return 'Not implemented yet' as const;
  }),
  setRTPCapabilities: clientInVenueP.input(z.object({rtpCapabilities: RtpCapabilitiesSchema})).mutation(({input, ctx}) => {
    ctx.client.base.rtpCapabilities = input.rtpCapabilities;
    log.debug(`clint ${ctx.username} (${ctx.connectionId}) changed rtpCapabilities to: `, input.rtpCapabilities);
    // return 'Not implemented yet' as const;
  }),
  createSendTransport: clientInVenueP.mutation(async ({ctx}) => {
    return await ctx.client.base.createWebRtcTransport('send');
  }),
  createReceiveTransport: clientInVenueP.mutation(async ({ctx}) => {
    return await ctx.client.base.createWebRtcTransport('receive');
  }),
  connectTransport: clientInVenueP.input(ConnectTransportPayloadSchema).mutation(async ({ctx, input}) => {
    const client = ctx.client;
    const transportId = input.transportId;
    const dtlsParameters = input.dtlsParameters;
    let chosenTransport;

    if(transportId === client.base.receiveTransport?.id){
      chosenTransport = client.base.receiveTransport;
    } else if(transportId === client.base.sendTransport?.id){
      chosenTransport = client.base.sendTransport;
    } else{
      throw new TRPCError({code: 'NOT_FOUND', message:'no transport with that id on server-side'});
    }
    await chosenTransport.connect({dtlsParameters});
  }),
  createProducer: clientInVenueP.input(CreateProducerPayloadSchema).mutation(async ({ctx, input}) => {
    log.info('received createProducer request!');
    const client: UserClient | SenderClient = ctx.client;

    if(!client.base.sendTransport){
      throw new TRPCError({code:'PRECONDITION_FAILED', message:'sendTransport is undefined. Need a sendtransport to produce'});
    } else if(client.base.sendTransport.id !== input.transportId){
      throw new TRPCError({code: 'BAD_REQUEST', message:'the provided transporId didnt match the id of the sendTransport'});
    }
    const producerId = await client.base.createProducer(input);
    log.info('gonna emit clientStateUpdated!');
    if(client.clientType === 'client'){
      ctx.venue.emitToAllClients('clientState', { clientState: client.getPublicState(), reason: 'client created producer' });
    } else {
      ctx.venue.emitToAllClients('senderState', {senderState: client.getPublicState(), reason: 'sender created producer'});
    }
    return producerId;
  }),
  closeProducer: clientInVenueP.input(z.object({producerId:z.string().uuid()})).mutation(({input, ctx}) => {
    return 'Not implemented yet' as const;
  }),
  consumeCamera: clientInVenueP.input(z.object({cameraId: CameraIdSchema, producerId: ProducerIdSchema})).mutation(({ctx, input}) => {
    return 'NOT IMPLEMENTED YET :-(';
  }),
  // createConsumer: clientInVenueP.input(CreateConsumerPayloadSchema).mutation(({ctx, input}) => {
  //   log.info('received createConsumer request');
  //   const client = ctx.client;
  //   if(!client.receiveTransport){
  //     throw new TRPCError({code:'PRECONDITION_FAILED', message:'sendTransport is undefined. Need a sendtransport to produce'});
  //   }


  //         if(!client.rtpCapabilities){
  //           throw Error('rtpCapabilities of client unknown. Provide them before requesting to consume');
  //         }
  //         const requestedProducerId = input.producerId;
  //         const canConsume = ctx.venue.router.canConsume({producerId: requestedProducerId, rtpCapabilities: client.rtpCapabilities});
  //         if( !canConsume){
  //           throw new TRPCError({code: 'BAD_REQUEST', message: 'Client is not capable of consuming the producer according to provided rtpCapabilities'});
  //         }
  //         const producer = ctx.venue.producers.get(requestedProducerId);
  //         if(!producer){
  //           throw Error('no producer with that id found in current room!');
  //         }

  //         if(!this.receiveTransport){
  //           throw Error('A transport is required to create a consumer');
  //         }

  //         const consumer = await this.receiveTransport.consume({
  //           producerId: producer.id,
  //           rtpCapabilities: this.rtpCapabilities,
  //           paused: true,
  //         });

  //         this.consumers.set(consumer.id, consumer);

  //         consumer.on('transportclose', () => {
  //           console.log(`---consumer transport close--- client: ${this.id} consumer_id: ${consumer.id}`);
  //           this.send(createMessage('notifyCloseEvent', {
  //             objectType: 'consumer',
  //             objectId: consumer.id,
  //           }));
  //           this.consumers.delete(consumer.id);
  //           this.onClientStateUpdated('transport for a consumer closed');
  //         });

  //         consumer.on('producerclose', () => {
  //           console.log(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
  //           this.send(createMessage('notifyCloseEvent', {
  //             objectType: 'consumer',
  //             objectId: consumer.id
  //           }));
  //           this.consumers.delete(consumer.id);
  //         });

  //         consumer.on('producerpause', () => {
  //           console.log('producer was paused! Handler NOT IMPLEMENTED YET!');
  //         });
  //         consumer.on('producerresume', () => {
  //           console.log('producer was resumed! Handler NOT IMPLEMENTED YET!');
  //         });

  //         const {id, producerId, kind, rtpParameters} = consumer;

  //         response = createResponse('createConsumer', msg.id, {
  //           wasSuccess: true,
  //           data: {
  //             id, producerId, kind, rtpParameters
  //           }
  //         });
  //       } catch (e) {
  //         response = createResponse('createConsumer', msg.id, {
  //           wasSuccess: false,
  //           message: extractMessageFromCatch(e, 'failed to create consumer'),
  //         });
  //       }

  // }),
  subSoupObjectClosed: p.subscription(({ctx}) => {
    return attachEmitter(ctx.client.base.event, 'soupObjectClosed');
    // return 'Not implemented yet' as const;
  })
});
