-- CreateEnum
CREATE TYPE "public"."MaterialCategory" AS ENUM ('lecture', 'slide', 'exercise', 'reference', 'syllabus', 'other');

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "fileName" VARCHAR(255),
    "filePath" VARCHAR(500),
    "fileSize" BIGINT,
    "fileType" VARCHAR(50),
    "category" "public"."MaterialCategory" NOT NULL DEFAULT 'other',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_sectionId_idx" ON "public"."Material"("sectionId");

-- CreateIndex
CREATE INDEX "Material_uploadedBy_idx" ON "public"."Material"("uploadedBy");

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
