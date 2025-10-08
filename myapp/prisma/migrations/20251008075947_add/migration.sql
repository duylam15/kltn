/*
  Warnings:

  - Made the column `originalAssignmentId` on table `Assignment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Assignment" ALTER COLUMN "originalAssignmentId" SET NOT NULL,
ALTER COLUMN "originalAssignmentId" SET DATA TYPE VARCHAR(100);
