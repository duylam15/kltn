-- CreateTable
CREATE TABLE "public"."SubjectInstructor" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "role" "public"."InstructorRole" NOT NULL DEFAULT 'owner',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectInstructor_teacherId_idx" ON "public"."SubjectInstructor"("teacherId");

-- CreateIndex
CREATE INDEX "SubjectInstructor_subjectId_idx" ON "public"."SubjectInstructor"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectInstructor_isActive_idx" ON "public"."SubjectInstructor"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectInstructor_subjectId_teacherId_key" ON "public"."SubjectInstructor"("subjectId", "teacherId");

-- AddForeignKey
ALTER TABLE "public"."SubjectInstructor" ADD CONSTRAINT "SubjectInstructor_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubjectInstructor" ADD CONSTRAINT "SubjectInstructor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
