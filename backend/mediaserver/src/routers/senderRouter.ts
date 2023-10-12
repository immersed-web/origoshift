import { Log } from 'debug-level';
const log = new Log('Router:Sender');
process.env.DEBUG = 'Router:Sender*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { CameraFOVUpdateSchema, SenderIdSchema } from 'schemas';
import { isSenderClientM, procedure as p, router, senderInVenueP } from '../trpc/trpc';
import { observable } from '@trpc/server/observable';
import { NotifierInputData } from '../trpc/trpc-utils';
import { SenderClient } from '../classes/InternalClasses';
import prismaClient, { cameraIncludeStuff } from '../modules/prismaClient';

const senderClientP = p.use(isSenderClientM);

export const senderRouter = router({
  getClientState: senderClientP.query(({ctx}) => {
    return ctx.client.getPublicState();
  }),
  subOwnClientState: senderClientP.subscription(({ctx}) => {
    return observable<NotifierInputData<SenderClient['notify']['myStateUpdated']>>((scriber) => {
      ctx.client.notify.myStateUpdated = scriber.next;
      return () => ctx.client.notify.myStateUpdated = undefined;
    });
    // return attachToEvent(ctx.client.senderClientEvent, 'myStateUpdated');
  }),
  setSenderId: senderClientP.input(SenderIdSchema).mutation(({ctx, input}) => {

    log.info('received new senderID from client:', input);
    ctx.client.senderId = input;
  }),
  // TODO: Make this part of the camera dashboard instead of sender interface. I.E move to adminrouter and update everything else accordingly
  setCameraFOV: senderInVenueP.input(CameraFOVUpdateSchema).mutation(async ({ctx, input}) => {
    const dbResponse = await prismaClient.camera.update({
      where: {
        cameraId: input.cameraId,
      },
      include: cameraIncludeStuff,
      data: {
        ...input.FOV
      }
    });
    const camera = ctx.venue.cameras.get(input.cameraId);
    if(!camera) return;
    camera.prismaData = dbResponse;
    camera._notifyStateUpdated('FOV updated');
    return dbResponse;
  }),
});
