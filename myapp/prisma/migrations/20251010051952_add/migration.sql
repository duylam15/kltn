-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "userAgent" VARCHAR(500);

-- AlterTable
ALTER TABLE "public"."AttendanceSession" ADD COLUMN     "allowedDevices" JSONB,
ADD COLUMN     "maxCheckInsPerIP" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "requireDeviceCheck" BOOLEAN NOT NULL DEFAULT true;
