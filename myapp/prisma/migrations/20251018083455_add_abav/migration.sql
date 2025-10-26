/*
  Warnings:

  - You are about to drop the column `autoGraded` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `essayAnswer` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `executionTime` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `isCorrect` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsed` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `selectedChoices` on the `SubmissionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SubmissionAnswer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."JudgeStatus" AS ENUM ('queued', 'running', 'passed', 'failed', 'compile_error', 'runtime_error', 'timeout');

-- DropIndex
DROP INDEX "public"."SubmissionAnswer_questionId_idx";

-- AlterTable
ALTER TABLE "public"."SubmissionAnswer" DROP COLUMN "autoGraded",
DROP COLUMN "createdAt",
DROP COLUMN "essayAnswer",
DROP COLUMN "executionTime",
DROP COLUMN "feedback",
DROP COLUMN "isCorrect",
DROP COLUMN "memoryUsed",
DROP COLUMN "selectedChoices",
DROP COLUMN "updatedAt",
ADD COLUMN     "compileLog" TEXT,
ADD COLUMN     "filePath" VARCHAR(500),
ADD COLUMN     "isFolder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "judgeStatus" "public"."JudgeStatus" NOT NULL DEFAULT 'queued',
ADD COLUMN     "stderrLog" TEXT,
ADD COLUMN     "stdoutLog" TEXT;
