/*
  Warnings:

  - You are about to drop the `GradeColumn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeColumnAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeColumnAttendanceSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentGrade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GradeColumn" DROP CONSTRAINT "GradeColumn_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeColumnAssignment" DROP CONSTRAINT "GradeColumnAssignment_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeColumnAssignment" DROP CONSTRAINT "GradeColumnAssignment_gradeColumnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" DROP CONSTRAINT "GradeColumnAttendanceSession_gradeColumnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" DROP CONSTRAINT "GradeColumnAttendanceSession_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentGrade" DROP CONSTRAINT "StudentGrade_gradeColumnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentGrade" DROP CONSTRAINT "StudentGrade_overriddenBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentGrade" DROP CONSTRAINT "StudentGrade_studentId_fkey";

-- AlterTable
ALTER TABLE "public"."CourseSection" ADD COLUMN     "gradeTemplateId" INTEGER;

-- DropTable
DROP TABLE "public"."GradeColumn";

-- DropTable
DROP TABLE "public"."GradeColumnAssignment";

-- DropTable
DROP TABLE "public"."GradeColumnAttendanceSession";

-- DropTable
DROP TABLE "public"."StudentGrade";

-- DropEnum
DROP TYPE "public"."GradeCalculationMethod";

-- DropEnum
DROP TYPE "public"."GradeColumnType";

-- DropEnum
DROP TYPE "public"."GradeColumnType_old";

-- CreateIndex
CREATE INDEX "CourseSection_gradeTemplateId_idx" ON "public"."CourseSection"("gradeTemplateId");
