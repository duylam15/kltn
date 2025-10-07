/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `GradeColumn` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AssignmentScoreMethod" AS ENUM ('average', 'total', 'weighted', 'best', 'latest');

-- DropForeignKey
ALTER TABLE "public"."GradeColumn" DROP CONSTRAINT "GradeColumn_assignmentId_fkey";

-- AlterTable
ALTER TABLE "public"."CourseSection" ADD COLUMN     "gradeTemplateId" INTEGER;

-- AlterTable
ALTER TABLE "public"."GradeColumn" DROP COLUMN "assignmentId",
ADD COLUMN     "assignmentConfig" JSONB,
ADD COLUMN     "assignmentScoreMethod" "public"."AssignmentScoreMethod";

-- AlterTable
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."GradeTemplate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "subjectCode" VARCHAR(30),
    "department" VARCHAR(120),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeTemplateColumn" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "public"."GradeColumnType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isAutoCalculated" BOOLEAN NOT NULL DEFAULT false,
    "autoUpdate" BOOLEAN NOT NULL DEFAULT true,
    "attendanceScoreMethod" "public"."AttendanceScoreMethod",
    "attendanceConfig" JSONB,
    "assignmentScoreMethod" "public"."AssignmentScoreMethod",
    "assignmentConfig" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeTemplateColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeTemplateFormula" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "formula" JSONB NOT NULL,
    "gradeScale" JSONB,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeTemplateFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAssignment" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isExtraCredit" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeTemplate_subjectCode_idx" ON "public"."GradeTemplate"("subjectCode");

-- CreateIndex
CREATE INDEX "GradeTemplate_department_idx" ON "public"."GradeTemplate"("department");

-- CreateIndex
CREATE INDEX "GradeTemplate_isPublic_idx" ON "public"."GradeTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "GradeTemplate_isActive_idx" ON "public"."GradeTemplate"("isActive");

-- CreateIndex
CREATE INDEX "GradeTemplateColumn_templateId_order_idx" ON "public"."GradeTemplateColumn"("templateId", "order");

-- CreateIndex
CREATE INDEX "GradeTemplateColumn_type_idx" ON "public"."GradeTemplateColumn"("type");

-- CreateIndex
CREATE UNIQUE INDEX "GradeTemplateFormula_templateId_key" ON "public"."GradeTemplateFormula"("templateId");

-- CreateIndex
CREATE INDEX "GradeColumnAssignment_gradeColumnId_idx" ON "public"."GradeColumnAssignment"("gradeColumnId");

-- CreateIndex
CREATE INDEX "GradeColumnAssignment_assignmentId_idx" ON "public"."GradeColumnAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAssignment_gradeColumnId_assignmentId_key" ON "public"."GradeColumnAssignment"("gradeColumnId", "assignmentId");

-- CreateIndex
CREATE INDEX "CourseSection_gradeTemplateId_idx" ON "public"."CourseSection"("gradeTemplateId");

-- AddForeignKey
ALTER TABLE "public"."CourseSection" ADD CONSTRAINT "CourseSection_gradeTemplateId_fkey" FOREIGN KEY ("gradeTemplateId") REFERENCES "public"."GradeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTemplateColumn" ADD CONSTRAINT "GradeTemplateColumn_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."GradeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTemplateFormula" ADD CONSTRAINT "GradeTemplateFormula_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."GradeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
