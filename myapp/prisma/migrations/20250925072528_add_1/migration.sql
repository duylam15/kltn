/*
  Warnings:

  - You are about to drop the column `isOpen` on the `Material` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CourseMaterial" ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Material" DROP COLUMN "isOpen";
