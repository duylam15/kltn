/*
  Warnings:

  - You are about to drop the column `gradeTemplateId` on the `CourseSection` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."GradeColumnType" AS ENUM ('attendance', 'assignment', 'midterm', 'final', 'participation', 'project', 'custom');

-- CreateEnum
CREATE TYPE "public"."GradeCalculationMethod" AS ENUM ('average', 'weighted_average', 'sum', 'best_n', 'latest', 'highest', 'percentage');

-- DropIndex
DROP INDEX "public"."CourseSection_gradeTemplateId_idx";

-- AlterTable
ALTER TABLE "public"."CourseSection" DROP COLUMN "gradeTemplateId";

-- CreateTable
CREATE TABLE "public"."GradeColumn" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "public"."GradeColumnType" NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weight" DOUBLE PRECISION,
    "calculationMethod" "public"."GradeCalculationMethod" NOT NULL DEFAULT 'average',
    "bestNCount" INTEGER,
    "dropLowest" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAttendanceSession" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAssignment" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentGrade" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "note" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overriddenScore" DOUBLE PRECISION,
    "overriddenAt" TIMESTAMP(3),
    "overriddenBy" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeColumn_sectionId_idx" ON "public"."GradeColumn"("sectionId");

-- CreateIndex
CREATE INDEX "GradeColumnAttendanceSession_sessionId_idx" ON "public"."GradeColumnAttendanceSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAttendanceSession_gradeColumnId_sessionId_key" ON "public"."GradeColumnAttendanceSession"("gradeColumnId", "sessionId");

-- CreateIndex
CREATE INDEX "GradeColumnAssignment_assignmentId_idx" ON "public"."GradeColumnAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAssignment_gradeColumnId_assignmentId_key" ON "public"."GradeColumnAssignment"("gradeColumnId", "assignmentId");

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_idx" ON "public"."StudentGrade"("studentId");

-- CreateIndex
CREATE INDEX "StudentGrade_gradeColumnId_idx" ON "public"."StudentGrade"("gradeColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_gradeColumnId_studentId_key" ON "public"."StudentGrade"("gradeColumnId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."GradeColumn" ADD CONSTRAINT "GradeColumn_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_overriddenBy_fkey" FOREIGN KEY ("overriddenBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
