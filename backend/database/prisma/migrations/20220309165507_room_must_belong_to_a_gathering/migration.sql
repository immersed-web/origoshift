/*
  Warnings:

  - Made the column `gatheringId` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_gatheringId_fkey";

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "gatheringId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_gatheringId_fkey" FOREIGN KEY ("gatheringId") REFERENCES "Gathering"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
