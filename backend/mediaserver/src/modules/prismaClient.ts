import { PrismaClient, Prisma } from 'database';
// export * from 'database';

export default new PrismaClient({errorFormat: 'pretty'});

export const cameraIncludeStuff = {
  cameraPortals: {
    select: {
      toCameraId: true,
      x: true,
      y: true,
      distance: true,
    }
  }
} satisfies Prisma.CameraInclude;
const args = {include: cameraIncludeStuff} satisfies Prisma.CameraArgs;
export type CameraWithIncludes = Prisma.CameraGetPayload<typeof args>