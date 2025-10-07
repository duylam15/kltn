/*
  Warnings:

  - You are about to drop the column `sectionId` on the `Assignment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_sectionId_fkey";

-- DropIndex
DROP INDEX "public"."Assignment_dueDate_idx";

-- DropIndex
DROP INDEX "public"."Assignment_sectionId_idx";

-- AlterTable
ALTER TABLE "public"."Assignment" DROP COLUMN "sectionId";

-- CreateTable
CREATE TABLE "public"."SectionAssignment" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionAssignment_assignmentId_idx" ON "public"."SectionAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionAssignment_sectionId_assignmentId_key" ON "public"."SectionAssignment"("sectionId", "assignmentId");

-- AddForeignKey
ALTER TABLE "public"."SectionAssignment" ADD CONSTRAINT "SectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionAssignment" ADD CONSTRAINT "SectionAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
