/*
  Warnings:

  - You are about to drop the column `sectionId` on the `Material` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_sectionId_fkey";

-- DropIndex
DROP INDEX "public"."Material_sectionId_idx";

-- DropIndex
DROP INDEX "public"."Material_uploadedBy_idx";

-- AlterTable
ALTER TABLE "public"."Material" DROP COLUMN "sectionId",
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "fileName" SET DATA TYPE TEXT,
ALTER COLUMN "filePath" SET DATA TYPE TEXT,
ALTER COLUMN "fileType" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "public"."CourseMaterial" (
    "id" SERIAL NOT NULL,
    "courseSectionId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseMaterial_courseSectionId_materialId_key" ON "public"."CourseMaterial"("courseSectionId", "materialId");

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "public"."CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
