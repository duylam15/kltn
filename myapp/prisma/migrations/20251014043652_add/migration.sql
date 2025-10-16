-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Subject" ADD COLUMN     "description" TEXT;
