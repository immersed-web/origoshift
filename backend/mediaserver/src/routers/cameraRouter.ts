import { Log } from 'debug-level';
const log = new Log('Router:Camera');
process.env.DEBUG = 'Router:Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);

import { z } from 'zod';
import { router, procedure as p, isInCameraM, userInVenueP, userClientP, atLeastModeratorP, isVenueOwnerM} from '../trpc/trpc';
import { CameraIdSchema } from 'schemas';
import { TRPCError } from '@trpc/server';
import { attachToEvent, attachToFilteredEvent, NotifierInputData } from 'trpc/trpc-utils';
import { observable } from '@trpc/server/observable';
import { ConnectionIdSchema } from 'schemas';



export const cameraRouter = router({
  getCameraState: p.use(isInCameraM).query(({ctx}) => {
    return ctx.currentCamera.getPublicState();
  }),
  joinCamera: userInVenueP.input(z.object({
    cameraId: CameraIdSchema
  })).mutation(({ctx, input}) => {
    if(ctx.client.currentCamera){
      log.info('was already in a camera. leaving that camera first');
      ctx.client.leaveCurrentCamera();
    }
    const foundCamera = ctx.venue.cameras.get(input.cameraId);
    if(!foundCamera) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'no camera with that Id found in venue'});
    }
    foundCamera.addClient(ctx.client);
    return foundCamera.getPublicState();
  }),
  leaveCurrentCamera: userInVenueP.use(isInCameraM).mutation(({ctx}) => {
    return ctx.client.leaveCurrentCamera();
  }),
  subCameraStateUpdated: p.subscription(({ctx}) => {
    return observable<NotifierInputData<typeof ctx.client.notify.cameraStateUpdated>>(scriber => {
      ctx.client.notify.cameraStateUpdated = scriber.next;

      return () =>{
        ctx.client.notify.cameraStateUpdated = undefined;
      };
    });
  })
});
