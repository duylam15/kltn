-- DropIndex
DROP INDEX "public"."SubmissionAnswer_submissionId_questionId_key";

-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1;
