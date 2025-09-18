-- AlterTable
ALTER TABLE "public"."SectionEnrollment" ADD COLUMN     "groupId" INTEGER;

-- CreateIndex
CREATE INDEX "SectionEnrollment_groupId_idx" ON "public"."SectionEnrollment"("groupId");

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."SectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
