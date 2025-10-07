/*
  Warnings:

  - The values [quiz] on the enum `GradeColumnType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `gradeTemplateId` on the `CourseSection` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentConfig` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentScoreMethod` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceConfig` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceScoreMethod` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `autoUpdate` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `isAutoCalculated` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `isEditable` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `isVisible` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `lastCalculated` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `GradeColumn` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `GradeColumnAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `isExtraCredit` on the `GradeColumnAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `GradeColumnAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `GradeColumnAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `GradeColumnAttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `GradeColumnAttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `GradeColumnAttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeFormula` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeSummary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeTemplateColumn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeTemplateFormula` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."GradeCalculationMethod" AS ENUM ('average', 'weighted_average', 'sum', 'best_n', 'latest', 'highest', 'percentage');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."GradeColumnType_new" AS ENUM ('attendance', 'assignment', 'midterm', 'final', 'participation', 'project', 'custom');
ALTER TABLE "public"."GradeColumn" ALTER COLUMN "type" TYPE "public"."GradeColumnType_new" USING ("type"::text::"public"."GradeColumnType_new");
ALTER TYPE "public"."GradeColumnType" RENAME TO "GradeColumnType_old";
ALTER TYPE "public"."GradeColumnType_new" RENAME TO "GradeColumnType";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."CourseSection" DROP CONSTRAINT "CourseSection_gradeTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Grade" DROP CONSTRAINT "Grade_columnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Grade" DROP CONSTRAINT "Grade_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeFormula" DROP CONSTRAINT "GradeFormula_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeHistory" DROP CONSTRAINT "GradeHistory_changedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeSummary" DROP CONSTRAINT "GradeSummary_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeSummary" DROP CONSTRAINT "GradeSummary_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeTemplateColumn" DROP CONSTRAINT "GradeTemplateColumn_templateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeTemplateFormula" DROP CONSTRAINT "GradeTemplateFormula_templateId_fkey";

-- DropIndex
DROP INDEX "public"."CourseSection_gradeTemplateId_idx";

-- DropIndex
DROP INDEX "public"."GradeColumn_isAutoCalculated_idx";

-- DropIndex
DROP INDEX "public"."GradeColumn_sectionId_name_key";

-- DropIndex
DROP INDEX "public"."GradeColumn_sectionId_order_idx";

-- DropIndex
DROP INDEX "public"."GradeColumn_type_idx";

-- DropIndex
DROP INDEX "public"."GradeColumnAssignment_gradeColumnId_idx";

-- DropIndex
DROP INDEX "public"."GradeColumnAttendanceSession_gradeColumnId_idx";

-- AlterTable
ALTER TABLE "public"."CourseSection" DROP COLUMN "gradeTemplateId";

-- AlterTable
ALTER TABLE "public"."GradeColumn" DROP COLUMN "assignmentConfig",
DROP COLUMN "assignmentScoreMethod",
DROP COLUMN "attendanceConfig",
DROP COLUMN "attendanceScoreMethod",
DROP COLUMN "autoUpdate",
DROP COLUMN "isAutoCalculated",
DROP COLUMN "isEditable",
DROP COLUMN "isVisible",
DROP COLUMN "lastCalculated",
DROP COLUMN "order",
ADD COLUMN     "bestNCount" INTEGER,
ADD COLUMN     "calculationMethod" "public"."GradeCalculationMethod" NOT NULL DEFAULT 'average',
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dropLowest" INTEGER DEFAULT 0,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "weight" DROP NOT NULL,
ALTER COLUMN "weight" DROP DEFAULT,
ALTER COLUMN "maxScore" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "public"."GradeColumnAssignment" DROP COLUMN "createdAt",
DROP COLUMN "isExtraCredit",
DROP COLUMN "isRequired",
DROP COLUMN "order",
ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."GradeColumnAttendanceSession" DROP COLUMN "createdAt",
DROP COLUMN "isRequired",
DROP COLUMN "order",
ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "weight" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."Grade";

-- DropTable
DROP TABLE "public"."GradeFormula";

-- DropTable
DROP TABLE "public"."GradeHistory";

-- DropTable
DROP TABLE "public"."GradeSummary";

-- DropTable
DROP TABLE "public"."GradeTemplate";

-- DropTable
DROP TABLE "public"."GradeTemplateColumn";

-- DropTable
DROP TABLE "public"."GradeTemplateFormula";

-- DropEnum
DROP TYPE "public"."AssignmentScoreMethod";

-- DropEnum
DROP TYPE "public"."AttendanceScoreMethod";

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
CREATE INDEX "StudentGrade_studentId_idx" ON "public"."StudentGrade"("studentId");

-- CreateIndex
CREATE INDEX "StudentGrade_gradeColumnId_idx" ON "public"."StudentGrade"("gradeColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_gradeColumnId_studentId_key" ON "public"."StudentGrade"("gradeColumnId", "studentId");

-- CreateIndex
CREATE INDEX "GradeColumn_sectionId_idx" ON "public"."GradeColumn"("sectionId");

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_overriddenBy_fkey" FOREIGN KEY ("overriddenBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
