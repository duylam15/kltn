-- DropIndex
DROP INDEX "public"."CourseSection_sectionCode_key";

-- AlterTable
ALTER TABLE "public"."CourseSection" ALTER COLUMN "sectionCode" SET DATA TYPE TEXT;
