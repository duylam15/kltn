-- CreateEnum
CREATE TYPE "public"."DifficultyLevelAssignment" AS ENUM ('REMEDIAL', 'NORMAL', 'ADVANCED');

-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "difficulty" "public"."DifficultyLevelAssignment" NOT NULL DEFAULT 'NORMAL';
