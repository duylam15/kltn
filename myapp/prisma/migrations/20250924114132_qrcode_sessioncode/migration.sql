-- AlterTable
ALTER TABLE "public"."AttendanceSession" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "qrCodeUrl" TEXT;
