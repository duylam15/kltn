-- CreateTable
CREATE TABLE "public"."GradeColumnLink" (
    "id" SERIAL NOT NULL,
    "parentColumnId" INTEGER NOT NULL,
    "childColumnId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeColumnLink_childColumnId_idx" ON "public"."GradeColumnLink"("childColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnLink_parentColumnId_childColumnId_key" ON "public"."GradeColumnLink"("parentColumnId", "childColumnId");

-- AddForeignKey
ALTER TABLE "public"."GradeColumnLink" ADD CONSTRAINT "GradeColumnLink_parentColumnId_fkey" FOREIGN KEY ("parentColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnLink" ADD CONSTRAINT "GradeColumnLink_childColumnId_fkey" FOREIGN KEY ("childColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
