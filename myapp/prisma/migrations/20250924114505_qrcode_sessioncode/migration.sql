/*
  Warnings:

  - You are about to drop the column `checkInAt` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Attendance` table. All the data in the column will be lost.
  - The `status` column on the `Attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ipAddress` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `AttendanceSession` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('present', 'late', 'absent', 'warning');

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "checkInAt",
DROP COLUMN "ipAddress",
DROP COLUMN "location",
ADD COLUMN     "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'present';

-- AlterTable
ALTER TABLE "public"."AttendanceSession" DROP COLUMN "ipAddress",
DROP COLUMN "location",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "radius" DOUBLE PRECISION DEFAULT 50;

-- RenameIndex
ALTER INDEX "public"."Attendance_sessionId_studentId_key" RENAME TO "uniq_attendance";
