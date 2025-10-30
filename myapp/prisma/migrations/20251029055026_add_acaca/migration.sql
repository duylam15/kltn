/*
  Warnings:

  - Made the column `maxAttempts` on table `Assignment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Assignment" ALTER COLUMN "maxAttempts" SET NOT NULL;
