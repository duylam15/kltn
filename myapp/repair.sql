-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Question" DROP CONSTRAINT "Question_createdBy_fkey";

-- DropIndex
DROP INDEX "public"."Question_createdBy_idx";

-- DropIndex
DROP INDEX "public"."Question_subjectId_idx";

-- DropIndex
DROP INDEX "public"."Question_chapterId_idx";

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "createdBy";

-- CreateTable
CREATE TABLE "public"."QuestionSubject" (
    "id" SERIAL NOT NULL,
    "subjectCode" VARCHAR(30) NOT NULL,
    "subjectName" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionSubject_subjectCode_idx" ON "public"."QuestionSubject"("subjectCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSubject_subjectCode_key" ON "public"."QuestionSubject"("subjectCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_sectionCode_key" ON "public"."CourseSection"("sectionCode" ASC);

-- CreateIndex
CREATE INDEX "SubmissionAnswer_questionId_idx" ON "public"."SubmissionAnswer"("questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAnswer_submissionId_questionId_key" ON "public"."SubmissionAnswer"("submissionId" ASC, "questionId" ASC);

