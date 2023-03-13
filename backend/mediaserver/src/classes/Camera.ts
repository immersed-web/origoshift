
import { randomUUID } from 'crypto';
import { Log } from 'debug-level';
import  prisma from '../modules/prismaClient';
import type { Prisma, Camera as PrismaCamera } from 'database';
import type { CameraId } from 'schemas';
import type {Venue, UserClient} from './InternalClasses';

const log = new Log('Camera');

process.env.DEBUG = 'Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);


export class Camera {
  constructor(prismaCamera: PrismaCamera, venue: Venue){
    this.prismaData = prismaCamera;
    this.venue = venue;
    this.clients = new Map();
  }

  venue: Venue;
  clients: Venue['clients'];
  get clientIds() {
    return Array.from(this.clients.keys());
  }
  prismaData: PrismaCamera;
  get cameraId(){
    return this.prismaData.cameraId as CameraId;
  }
  get name() {
    return this.prismaData.name;
  }

  getPublicState() {
    const { cameraId, name, clientIds } = this;
    return { cameraId, name, clientIds };
  }

  /**
   * Add a client to the camera. This function also takes care of setting the clients currentCamera field.
   */
  addClient(client: UserClient){
    const cc = client.currentCamera;
    if(cc){
      cc.removeClient(client);
    }
    this.clients.set(client.connectionId, client);
    client._setCamera(this.cameraId);
  }

  removeClient(client: UserClient){
    const wasRemoved = this.clients.delete(client.connectionId);
    if(wasRemoved){
      client._setCamera();
    }
    return wasRemoved;
  }

  // STATIC STUFF LAST
  static async createNewCamera(name: string, venue: Venue){
    try {
      const result = await prisma.camera.create({
        data: {
          name,
          venue: {
            connect: {
              venueId: venue.venueId
            }
          },
          settings: {coolSetting: 'aaaww yeeeah'},
          // startTime: new Date(),
          // virtualSpace: {
          //   create: {
          //     settings: 'asdas'
          //   }
          // }

        }
      });

      return result.cameraId;
    } catch (e){
      log.error(e);
      throw e;
    }
  }

  static async loadCamera(cameraId: CameraId, venue: Venue, prismaCamera: PrismaCamera) {
    if(venue.cameras.has(cameraId)){
      throw Error('a camera with that id is already loaded');
    }

    if(!prismaCamera){
      prismaCamera = await prisma.camera.findUniqueOrThrow({where: {cameraId}});
    }
    const camera = new Camera(prismaCamera, venue);
    venue.cameras.set(camera.cameraId, camera);
  }

}
