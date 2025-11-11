-- AlterEnum
ALTER TYPE "public"."ProgrammingLanguage" ADD VALUE 'c';

-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "chapterId" INTEGER,
ADD COLUMN     "subjectId" INTEGER;

-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "public"."Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_chapterId_idx" ON "public"."Assignment"("chapterId");

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
