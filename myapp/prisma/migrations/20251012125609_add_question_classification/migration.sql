-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('easy', 'medium', 'hard');

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "chapterId" INTEGER,
ADD COLUMN     "difficulty" "public"."DifficultyLevel" NOT NULL DEFAULT 'medium',
ADD COLUMN     "subjectId" INTEGER,
ADD COLUMN     "tags" VARCHAR(500);

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

-- CreateTable
CREATE TABLE "public"."Chapter" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "chapterCode" VARCHAR(30) NOT NULL,
    "chapterName" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSubject_subjectCode_key" ON "public"."QuestionSubject"("subjectCode");

-- CreateIndex
CREATE INDEX "QuestionSubject_subjectCode_idx" ON "public"."QuestionSubject"("subjectCode");

-- CreateIndex
CREATE INDEX "Chapter_subjectId_idx" ON "public"."Chapter"("subjectId");

-- CreateIndex
CREATE INDEX "Chapter_chapterCode_idx" ON "public"."Chapter"("chapterCode");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subjectId_chapterCode_key" ON "public"."Chapter"("subjectId", "chapterCode");

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."QuestionSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."QuestionSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
