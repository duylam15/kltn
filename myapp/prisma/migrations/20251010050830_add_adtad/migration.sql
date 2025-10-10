-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "adjustedAt" TIMESTAMP(3),
ADD COLUMN     "adjustedBy" INTEGER,
ADD COLUMN     "deviceInfo" VARCHAR(255),
ADD COLUMN     "ipAddress" VARCHAR(45),
ADD COLUMN     "isValid" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."AttendanceScoreRule" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceScoreRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_section_status_rule" ON "public"."AttendanceScoreRule"("sectionId", "status");

-- AddForeignKey
ALTER TABLE "public"."AttendanceScoreRule" ADD CONSTRAINT "AttendanceScoreRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
