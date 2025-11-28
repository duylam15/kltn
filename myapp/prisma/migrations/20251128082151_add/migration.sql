/*
  Warnings:

  - You are about to drop the column `totpDigits` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `totpPeriod` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `totpSecretBase32` on the `Attendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "totpDigits",
DROP COLUMN "totpPeriod",
DROP COLUMN "totpSecretBase32";

-- AlterTable
ALTER TABLE "public"."AttendanceSession" ADD COLUMN     "sessionScore" DOUBLE PRECISION DEFAULT 10,
ADD COLUMN     "totpDigits" INTEGER DEFAULT 6,
ADD COLUMN     "totpPeriod" INTEGER DEFAULT 10,
ADD COLUMN     "totpSecretBase32" TEXT;
