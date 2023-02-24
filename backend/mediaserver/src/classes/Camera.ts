
import { randomUUID } from 'crypto';
import { Log } from 'debug-level';
import  prisma from 'modules/prismaClient';
import type { Prisma, Camera as PrismaCamera } from 'database';
import type { CameraId } from 'schemas';
import type {Venue, Client} from './InternalClasses';

const log = new Log('Camera');

process.env.DEBUG = 'Camera*, ' + process.env.DEBUG;
log.enable(process.env.DEBUG);


export class Camera {
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

  venue: Venue;
  clients: Venue['clients'];
  prismaData: PrismaCamera;
  get cameraId(){
    return this.prismaData.cameraId as CameraId;
  }
  get name() {
    return this.prismaData.name;
  }

  constructor(prismaCamera: PrismaCamera, venue: Venue){
    this.prismaData = prismaCamera;
    this.venue = venue;
    this.clients = new Map();
  }
  /**
   * Add a client to the camera. This function also takes care of setting the clients currentCamera field.
   */
  addClient(client: Client){
    this.clients.set(client.connectionId, client);
    client._setCamera(this.cameraId);
  }

  removeClient(client: Client){
    this.clients.delete(client.connectionId);
    client._setCamera();
  }
}
