-- DropForeignKey
ALTER TABLE "public"."CourseMaterial" DROP CONSTRAINT "CourseMaterial_courseSectionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseMaterial" DROP CONSTRAINT "CourseMaterial_materialId_fkey";

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
