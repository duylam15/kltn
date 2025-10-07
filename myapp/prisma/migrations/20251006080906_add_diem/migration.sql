-- CreateEnum
CREATE TYPE "public"."GradeColumnType" AS ENUM ('attendance', 'assignment', 'quiz', 'midterm', 'final', 'project', 'participation', 'custom');

-- CreateEnum
CREATE TYPE "public"."AttendanceScoreMethod" AS ENUM ('percentage', 'count', 'deduction', 'weighted');

-- CreateTable
CREATE TABLE "public"."GradeColumn" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "public"."GradeColumnType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isAutoCalculated" BOOLEAN NOT NULL DEFAULT false,
    "autoUpdate" BOOLEAN NOT NULL DEFAULT true,
    "assignmentId" INTEGER,
    "attendanceScoreMethod" "public"."AttendanceScoreMethod",
    "attendanceConfig" JSONB,
    "lastCalculated" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAttendanceSession" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Grade" (
    "id" SERIAL NOT NULL,
    "columnId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "note" VARCHAR(200),
    "isExcused" BOOLEAN NOT NULL DEFAULT false,
    "isAutoCalculated" BOOLEAN NOT NULL DEFAULT false,
    "calculationDetail" JSONB,
    "lastAutoUpdate" TIMESTAMP(3),
    "gradedBy" INTEGER,
    "gradedAt" TIMESTAMP(3),
    "lastModified" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeSummary" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "finalGrade" VARCHAR(5),
    "gpa" DECIMAL(3,2),
    "rank" INTEGER,
    "attendanceScore" DOUBLE PRECISION,
    "assignmentScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeFormula" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "formula" JSONB NOT NULL,
    "gradeScale" JSONB,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeHistory" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "oldScore" DOUBLE PRECISION,
    "newScore" DOUBLE PRECISION,
    "reason" TEXT,
    "changedBy" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeColumn_sectionId_order_idx" ON "public"."GradeColumn"("sectionId", "order");

-- CreateIndex
CREATE INDEX "GradeColumn_type_idx" ON "public"."GradeColumn"("type");

-- CreateIndex
CREATE INDEX "GradeColumn_isAutoCalculated_idx" ON "public"."GradeColumn"("isAutoCalculated");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumn_sectionId_name_key" ON "public"."GradeColumn"("sectionId", "name");

-- CreateIndex
CREATE INDEX "GradeColumnAttendanceSession_gradeColumnId_idx" ON "public"."GradeColumnAttendanceSession"("gradeColumnId");

-- CreateIndex
CREATE INDEX "GradeColumnAttendanceSession_sessionId_idx" ON "public"."GradeColumnAttendanceSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAttendanceSession_gradeColumnId_sessionId_key" ON "public"."GradeColumnAttendanceSession"("gradeColumnId", "sessionId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "public"."Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_columnId_idx" ON "public"."Grade"("columnId");

-- CreateIndex
CREATE INDEX "Grade_isAutoCalculated_idx" ON "public"."Grade"("isAutoCalculated");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_columnId_studentId_key" ON "public"."Grade"("columnId", "studentId");

-- CreateIndex
CREATE INDEX "GradeSummary_sectionId_totalScore_idx" ON "public"."GradeSummary"("sectionId", "totalScore");

-- CreateIndex
CREATE INDEX "GradeSummary_studentId_idx" ON "public"."GradeSummary"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeSummary_sectionId_studentId_key" ON "public"."GradeSummary"("sectionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeFormula_sectionId_key" ON "public"."GradeFormula"("sectionId");

-- CreateIndex
CREATE INDEX "GradeHistory_gradeId_idx" ON "public"."GradeHistory"("gradeId");

-- CreateIndex
CREATE INDEX "GradeHistory_studentId_idx" ON "public"."GradeHistory"("studentId");

-- CreateIndex
CREATE INDEX "GradeHistory_changedAt_idx" ON "public"."GradeHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "public"."GradeColumn" ADD CONSTRAINT "GradeColumn_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumn" ADD CONSTRAINT "GradeColumn_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grade" ADD CONSTRAINT "Grade_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSummary" ADD CONSTRAINT "GradeSummary_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeSummary" ADD CONSTRAINT "GradeSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeFormula" ADD CONSTRAINT "GradeFormula_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeHistory" ADD CONSTRAINT "GradeHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
