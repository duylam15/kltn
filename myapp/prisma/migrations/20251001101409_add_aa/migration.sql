/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `Question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Question" DROP CONSTRAINT "Question_assignmentId_fkey";

-- DropIndex
DROP INDEX "public"."Question_assignmentId_idx";

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "assignmentId";

-- CreateTable
CREATE TABLE "public"."AssignmentQuestion" (
    "assignmentId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentQuestion_pkey" PRIMARY KEY ("assignmentId","questionId")
);

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestion" ADD CONSTRAINT "AssignmentQuestion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestion" ADD CONSTRAINT "AssignmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
