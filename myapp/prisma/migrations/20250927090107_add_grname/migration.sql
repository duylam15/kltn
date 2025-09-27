-- AlterTable
ALTER TABLE "public"."Permission" ADD COLUMN     "groupName" VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(255);
