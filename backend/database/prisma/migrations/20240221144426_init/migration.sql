-- CreateEnum
CREATE TYPE "Role" AS ENUM ('gunnar', 'superadmin', 'admin', 'moderator', 'sender', 'user', 'guest');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'unlisted', 'public');

-- CreateEnum
CREATE TYPE "ModelFileFormat" AS ENUM ('gltf', 'glb');

-- CreateEnum
CREATE TYPE "CameraType" AS ENUM ('panoramic360', 'normal');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Venue" (
    "venueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "doorsOpeningTime" TIMESTAMP(3),
    "doorsAutoOpen" BOOLEAN NOT NULL DEFAULT false,
    "doorsManuallyOpened" BOOLEAN NOT NULL DEFAULT false,
    "streamStartTime" TIMESTAMP(3),
    "streamAutoStart" BOOLEAN NOT NULL DEFAULT false,
    "streamManuallyStarted" BOOLEAN NOT NULL DEFAULT false,
    "streamManuallyEnded" BOOLEAN NOT NULL DEFAULT false,
    "extraSettings" JSONB,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "mainCameraId" UUID,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("venueId")
);

-- CreateTable
CREATE TABLE "VirtualSpace" (
    "vrId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extraSettings" JSONB,
    "ownerVenueId" UUID NOT NULL,
    "virtualSpace3DModelId" UUID,

    CONSTRAINT "VirtualSpace_pkey" PRIMARY KEY ("vrId")
);

-- CreateTable
CREATE TABLE "VirtualSpace3DModel" (
    "modelId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "modelFileFormat" "ModelFileFormat",
    "navmeshFileFormat" "ModelFileFormat",
    "public" BOOLEAN NOT NULL DEFAULT false,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "entrancePosition" DOUBLE PRECISION[],
    "entranceRotation" DOUBLE PRECISION,
    "spawnPosition" DOUBLE PRECISION[],
    "spawnRadius" DOUBLE PRECISION,

    CONSTRAINT "VirtualSpace3DModel_pkey" PRIMARY KEY ("modelId")
);

-- CreateTable
CREATE TABLE "Camera" (
    "cameraId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "venueId" UUID NOT NULL,
    "senderId" UUID,
    "cameraType" "CameraType" NOT NULL DEFAULT 'panoramic360',
    "viewOriginX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "viewOriginY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fovStart" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fovEnd" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "orientation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settings" JSONB,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("cameraId")
);

-- CreateTable
CREATE TABLE "CameraPortal" (
    "fromCameraId" UUID NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "toCameraId" UUID NOT NULL,

    CONSTRAINT "CameraPortal_pkey" PRIMARY KEY ("fromCameraId","toCameraId")
);

-- CreateTable
CREATE TABLE "_usersOwningVenues" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_usersAllowedInVenues" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_usersBannedFromVenues" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_key" ON "Venue"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualSpace_ownerVenueId_key" ON "VirtualSpace"("ownerVenueId");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_name_venueId_key" ON "Camera"("name", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_senderId_venueId_key" ON "Camera"("senderId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "_usersOwningVenues_AB_unique" ON "_usersOwningVenues"("A", "B");

-- CreateIndex
CREATE INDEX "_usersOwningVenues_B_index" ON "_usersOwningVenues"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_usersAllowedInVenues_AB_unique" ON "_usersAllowedInVenues"("A", "B");

-- CreateIndex
CREATE INDEX "_usersAllowedInVenues_B_index" ON "_usersAllowedInVenues"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_usersBannedFromVenues_AB_unique" ON "_usersBannedFromVenues"("A", "B");

-- CreateIndex
CREATE INDEX "_usersBannedFromVenues_B_index" ON "_usersBannedFromVenues"("B");

-- AddForeignKey
ALTER TABLE "VirtualSpace" ADD CONSTRAINT "VirtualSpace_ownerVenueId_fkey" FOREIGN KEY ("ownerVenueId") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualSpace" ADD CONSTRAINT "VirtualSpace_virtualSpace3DModelId_fkey" FOREIGN KEY ("virtualSpace3DModelId") REFERENCES "VirtualSpace3DModel"("modelId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraPortal" ADD CONSTRAINT "CameraPortal_fromCameraId_fkey" FOREIGN KEY ("fromCameraId") REFERENCES "Camera"("cameraId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraPortal" ADD CONSTRAINT "CameraPortal_toCameraId_fkey" FOREIGN KEY ("toCameraId") REFERENCES "Camera"("cameraId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersOwningVenues" ADD CONSTRAINT "_usersOwningVenues_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersOwningVenues" ADD CONSTRAINT "_usersOwningVenues_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersAllowedInVenues" ADD CONSTRAINT "_usersAllowedInVenues_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersAllowedInVenues" ADD CONSTRAINT "_usersAllowedInVenues_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersBannedFromVenues" ADD CONSTRAINT "_usersBannedFromVenues_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersBannedFromVenues" ADD CONSTRAINT "_usersBannedFromVenues_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;
