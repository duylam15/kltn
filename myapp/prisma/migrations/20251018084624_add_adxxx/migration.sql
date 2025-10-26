/*
  Warnings:

  - You are about to drop the column `selectedChoice` on the `SubmissionAnswer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SubmissionAnswer" DROP COLUMN "selectedChoice",
ADD COLUMN     "selectedChoices" INTEGER[];
