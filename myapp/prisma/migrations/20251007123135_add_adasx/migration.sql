/*
  Warnings:

  - Added the required column `assignedBy` to the `CourseMaterial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CourseMaterial" ADD COLUMN     "assignedBy" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "CourseMaterial_assignedBy_idx" ON "public"."CourseMaterial"("assignedBy");

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
