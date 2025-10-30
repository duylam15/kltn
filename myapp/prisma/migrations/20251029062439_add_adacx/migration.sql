/*
  Warnings:

  - A unique constraint covering the columns `[assignmentId,studentId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Assignment" ALTER COLUMN "maxAttempts" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "public"."Submission"("assignmentId", "studentId");
