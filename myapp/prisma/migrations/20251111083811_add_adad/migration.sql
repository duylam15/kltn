/*
  Warnings:

  - The values [c] on the enum `ProgrammingLanguage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `note` on the `Attendance` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProgrammingLanguage_new" AS ENUM ('javascript', 'python', 'java', 'cpp', 'csharp', 'php', 'html', 'css');
ALTER TABLE "public"."Question" ALTER COLUMN "language" TYPE "public"."ProgrammingLanguage_new" USING ("language"::text::"public"."ProgrammingLanguage_new");
ALTER TABLE "public"."SubmissionAnswer" ALTER COLUMN "language" TYPE "public"."ProgrammingLanguage_new" USING ("language"::text::"public"."ProgrammingLanguage_new");
ALTER TYPE "public"."ProgrammingLanguage" RENAME TO "ProgrammingLanguage_old";
ALTER TYPE "public"."ProgrammingLanguage_new" RENAME TO "ProgrammingLanguage";
DROP TYPE "public"."ProgrammingLanguage_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "note",
ADD COLUMN     "totpDigits" INTEGER DEFAULT 6,
ADD COLUMN     "totpPeriod" INTEGER DEFAULT 10,
ADD COLUMN     "totpSecretBase32" TEXT;

-- CreateTable
CREATE TABLE "public"."AttendanceNonce" (
    "value" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceNonce_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "public"."DeviceFingerprint" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceLog" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipCountry" TEXT,
    "ipCity" TEXT,
    "flags" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceFingerprint_studentId_idx" ON "public"."DeviceFingerprint"("studentId");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_sessionId_idx" ON "public"."DeviceFingerprint"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_sessionId_deviceId_key" ON "public"."DeviceFingerprint"("sessionId", "deviceId");

-- AddForeignKey
ALTER TABLE "public"."AttendanceNonce" ADD CONSTRAINT "AttendanceNonce_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceFingerprint" ADD CONSTRAINT "DeviceFingerprint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceFingerprint" ADD CONSTRAINT "DeviceFingerprint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceLog" ADD CONSTRAINT "AttendanceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceLog" ADD CONSTRAINT "AttendanceLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
