/*
  Warnings:

  - You are about to drop the column `chapterId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Assignment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_subjectId_fkey";

-- DropIndex
DROP INDEX "public"."Assignment_chapterId_idx";

-- DropIndex
DROP INDEX "public"."Assignment_subjectId_idx";

-- AlterTable
ALTER TABLE "public"."Assignment" DROP COLUMN "chapterId",
DROP COLUMN "subjectId";
