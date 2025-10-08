/*
  Warnings:

  - Added the required column `createdBy` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "originalAssignmentId" INTEGER;
