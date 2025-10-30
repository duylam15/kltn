/*
  Warnings:

  - A unique constraint covering the columns `[submissionId,questionId]` on the table `SubmissionAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Submission_assignmentId_studentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAnswer_submissionId_questionId_key" ON "public"."SubmissionAnswer"("submissionId", "questionId");
