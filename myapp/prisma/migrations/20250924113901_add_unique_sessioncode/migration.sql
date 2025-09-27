/*
  Warnings:

  - A unique constraint covering the columns `[sessionCode]` on the table `AttendanceSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_sessionCode_key" ON "public"."AttendanceSession"("sessionCode");
