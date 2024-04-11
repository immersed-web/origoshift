/*
  Warnings:

  - You are about to drop the column `skyColor` on the `VirtualSpace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VirtualSpace" DROP COLUMN "skyColor";

-- AlterTable
ALTER TABLE "VirtualSpace3DModel" ADD COLUMN     "skyColor" TEXT;
