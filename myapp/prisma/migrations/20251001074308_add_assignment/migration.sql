-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('multiple_choice', 'essay', 'coding', 'true_false');

-- CreateEnum
CREATE TYPE "public"."ProgrammingLanguage" AS ENUM ('javascript', 'python', 'java', 'cpp', 'csharp');

-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAttempts" INTEGER DEFAULT 1,
ADD COLUMN     "passingScore" DOUBLE PRECISION,
ADD COLUMN     "showAnswersAfterSubmit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeLimit" INTEGER,
ALTER COLUMN "maxScore" SET DEFAULT 100,
ALTER COLUMN "maxScore" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "autoGraded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "maxScore" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "language" "public"."ProgrammingLanguage",
    "starterCode" TEXT,
    "timeLimit" INTEGER,
    "memoryLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionChoice" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TestCase" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubmissionAnswer" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedChoices" JSONB,
    "essayAnswer" TEXT,
    "codeAnswer" TEXT,
    "language" "public"."ProgrammingLanguage",
    "executionTime" INTEGER,
    "memoryUsed" INTEGER,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "isCorrect" BOOLEAN,
    "autoGraded" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "testResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_assignmentId_idx" ON "public"."Question"("assignmentId");

-- CreateIndex
CREATE INDEX "QuestionChoice_questionId_idx" ON "public"."QuestionChoice"("questionId");

-- CreateIndex
CREATE INDEX "TestCase_questionId_idx" ON "public"."TestCase"("questionId");

-- CreateIndex
CREATE INDEX "SubmissionAnswer_questionId_idx" ON "public"."SubmissionAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAnswer_submissionId_questionId_key" ON "public"."SubmissionAnswer"("submissionId", "questionId");

-- CreateIndex
CREATE INDEX "Assignment_sectionId_idx" ON "public"."Assignment"("sectionId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "public"."Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "public"."Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "public"."Submission"("assignmentId");

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionChoice" ADD CONSTRAINT "QuestionChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
