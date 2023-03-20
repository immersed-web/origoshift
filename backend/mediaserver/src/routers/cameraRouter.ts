
import { Log } from 'debug-level';
import { z } from 'zod';
import { router, procedure as p, isInCameraM, userInVenueP, userClientP} from '../trpc/trpc';
import { CameraIdSchema } from 'schemas';
import { TRPCError } from '@trpc/server';
import { attachToEvent, attachToFilteredEvent, NotifierInputData } from 'trpc/trpc-utils';
import { observable } from '@trpc/server/observable';
const log = new Log('Router:Camera');
process.env.DEBUG = 'Router:Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);



export const cameraRouter = router({
  getCameraState: p.use(isInCameraM).query(({ctx}) => {
    return ctx.currentCamera.getPublicState();
  }),
  joinCamera: userInVenueP.input(z.object({
    cameraId: CameraIdSchema
  })).mutation(({ctx, input}) => {
    const foundCamera = ctx.venue.cameras.get(input.cameraId);
    if(!foundCamera) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'no camera with that Id found in venue'});
    }
    foundCamera.addClient(ctx.client);
    return foundCamera.getPublicState();
  }),
  subProducerAddedOrRemoved: userClientP.subscription(({ctx}) => {
    type ProdAddRemoveInput = NotifierInputData<typeof ctx.client.notify.newProducerInCamera> | NotifierInputData<typeof ctx.client.notify.producerRemovedInCamera>;
    return observable<ProdAddRemoveInput>((scriber) => {
      ctx.client.notify.newProducerInCamera = scriber.next;
      ctx.client.notify.producerRemovedInCamera = scriber.next;
    });
    // return attachToFilteredEvent(ctx.client.clientEvent, '');
  }),

});
