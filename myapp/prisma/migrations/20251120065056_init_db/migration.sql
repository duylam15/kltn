/*
  Warnings:

  - Added the required column `studentId` to the `SubmissionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "createdBy" INTEGER;

-- AlterTable
ALTER TABLE "public"."SubmissionAnswer" ADD COLUMN     "studentId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Question_createdBy_idx" ON "public"."Question"("createdBy");

-- CreateIndex
CREATE INDEX "Question_subjectId_idx" ON "public"."Question"("subjectId");

-- CreateIndex
CREATE INDEX "Question_chapterId_idx" ON "public"."Question"("chapterId");

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
