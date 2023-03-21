import { Log } from 'debug-level';
const log = new Log('Soup:Router');
process.env.DEBUG = 'Soup:Router*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { TRPCError } from '@trpc/server';
import {CreateProducerPayloadSchema, ConnectTransportPayloadSchema, ProducerId, RtpCapabilitiesSchema, CreateConsumerPayloadSchema, ProducerIdSchema, ConsumerId } from 'schemas/mediasoup';
import { z } from 'zod';
import { procedure as p, clientInVenueP, router, userClientP, atLeastModeratorP } from '../trpc/trpc';
import { attachToEvent, attachToFilteredEvent } from '../trpc/trpc-utils';
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
    ctx.venue.emitToAllClients('producerCreated', {producingConnectionId: ctx.connectionId, producer: {producerId, paused: input.producerInfo.isPaused, kind: input.kind}});
    // ctx.venue.emitToAllClients('someClientStateUpdated', { clientState: client.getPublicState(), reason: `client (${client.clientType}) created producer` });
    return producerId;
  }),
  closeProducer: clientInVenueP.input(z.object({producerId:z.string().uuid()})).mutation(({input, ctx}) => {
    return 'Not implemented yet' as const;
  }),
  subProducerCreated: atLeastModeratorP.subscription(({ctx}) => {
    return attachToFilteredEvent(ctx.client.clientEvent, 'producerCreated', ctx.connectionId);
  }),
  consumeCamera: clientInVenueP.input(z.object({cameraId: CameraIdSchema, producerId: ProducerIdSchema})).mutation(({ctx, input}) => {
    return 'NOT IMPLEMENTED YET :-(' as const;
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
    const requestedProducerId = input.producerId;
    const canConsume = ctx.venue.router.canConsume({producerId: requestedProducerId, rtpCapabilities: client.rtpCapabilities});
    if( !canConsume){
      throw new TRPCError({code: 'BAD_REQUEST', message: 'Client is not capable of consuming the producer according to provided rtpCapabilities'});
    }

    const consumer = await client.receiveTransport.consume({
      producerId: input.producerId,
      rtpCapabilities: client.rtpCapabilities,
      paused: true,
    });

    const consumerId = consumer.id as ConsumerId;

    client.consumers.set(consumerId, consumer);

    consumer.on('transportclose', () => {
      console.log(`---consumer transport close--- clientConnection: ${ctx.connectionId} consumer_id: ${consumerId}`);
      // this.send(createMessage('notifyCloseEvent', {
      //   objectType: 'consumer',
      //   objectId: consumer.id,
      // }));
      // this.consumers.delete(consumer.id);
      // this.onClientStateUpdated('transport for a consumer closed');

      client.consumers.delete(consumerId);

      client.clientEvent.emit('soupObjectClosed', {
        type: 'consumer',
        id: consumerId,
        reason: 'transport for the consumer was closed'
      });
    });

    consumer.on('producerclose', () => {
      console.log(`the producer associated with consumer ${consumer.id} closed so the consumer was also closed`);
      // this.send(createMessage('notifyCloseEvent', {
      //   objectType: 'consumer',
      //   objectId: consumer.id
      // }));
      // this.consumers.delete(consumer.id);
      client.consumers.delete(consumerId);
      client.clientEvent.emit('soupObjectClosed', {
        type: 'consumer',
        id: consumerId,
        reason: 'producer for the consumer was closed'
      });
    });

    consumer.on('producerpause', () => {
      console.log('producer was paused! Handler NOT IMPLEMENTED YET!');
    });
    consumer.on('producerresume', () => {
      console.log('producer was resumed! Handler NOT IMPLEMENTED YET!');
    });

    const {id, producerId, kind, rtpParameters} = consumer;
    return {
      id, producerId, kind, rtpParameters
    };

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

  }),
  subSoupObjectClosed: p.subscription(({ctx}) => {
    return attachToEvent(ctx.client.clientEvent, 'soupObjectClosed');
    // return 'Not implemented yet' as const;
  })
});
