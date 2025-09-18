-- CreateEnum
CREATE TYPE "public"."StudentStatus" AS ENUM ('active', 'suspended', 'graduated', 'dropped');

-- CreateEnum
CREATE TYPE "public"."CourseSectionStatus" AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."InstructorRole" AS ENUM ('owner', 'co', 'ta');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('enrolled', 'dropped', 'completed');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "phone" VARCHAR(20),
    "dateOfBirth" TIMESTAMP(3),
    "address" VARCHAR(200),
    "roleId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "studentCode" VARCHAR(30) NOT NULL,
    "className" VARCHAR(50),
    "major" VARCHAR(100),
    "academicYear" VARCHAR(15),
    "enrollmentYear" INTEGER,
    "gpa" DECIMAL(4,2) DEFAULT 0.00,
    "status" "public"."StudentStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Teacher" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "teacherCode" VARCHAR(30) NOT NULL,
    "department" VARCHAR(120),
    "position" VARCHAR(80),
    "specialization" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" SERIAL NOT NULL,
    "subjectCode" VARCHAR(30) NOT NULL,
    "subjectName" VARCHAR(200) NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Term" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startDate" DATE,
    "endDate" DATE,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseSection" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "sectionCode" VARCHAR(40) NOT NULL,
    "schedule" JSONB,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."CourseSectionStatus" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectionInstructor" (
    "sectionId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "role" "public"."InstructorRole" NOT NULL DEFAULT 'owner',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionInstructor_pkey" PRIMARY KEY ("sectionId","teacherId")
);

-- CreateTable
CREATE TABLE "public"."SectionGroup" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "groupCode" VARCHAR(40),
    "groupName" VARCHAR(100),
    "maxMembers" INTEGER NOT NULL DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectionEnrollment" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "public"."User"("roleId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "User_lastLogin_idx" ON "public"."User"("lastLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "public"."Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentCode_key" ON "public"."Student"("studentCode");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "public"."Student"("status");

-- CreateIndex
CREATE INDEX "Student_className_idx" ON "public"."Student"("className");

-- CreateIndex
CREATE INDEX "Student_major_idx" ON "public"."Student"("major");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "public"."Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacherCode_key" ON "public"."Teacher"("teacherCode");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "public"."Teacher"("department");

-- CreateIndex
CREATE INDEX "Teacher_position_idx" ON "public"."Teacher"("position");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "public"."RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_revokedAt_idx" ON "public"."RefreshToken"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_subjectCode_key" ON "public"."Subject"("subjectCode");

-- CreateIndex
CREATE INDEX "Subject_subjectCode_idx" ON "public"."Subject"("subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "Term_code_key" ON "public"."Term"("code");

-- CreateIndex
CREATE INDEX "Term_code_idx" ON "public"."Term"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_sectionCode_key" ON "public"."CourseSection"("sectionCode");

-- CreateIndex
CREATE INDEX "CourseSection_subjectId_idx" ON "public"."CourseSection"("subjectId");

-- CreateIndex
CREATE INDEX "CourseSection_termId_idx" ON "public"."CourseSection"("termId");

-- CreateIndex
CREATE INDEX "CourseSection_sectionCode_idx" ON "public"."CourseSection"("sectionCode");

-- CreateIndex
CREATE INDEX "SectionInstructor_teacherId_idx" ON "public"."SectionInstructor"("teacherId");

-- CreateIndex
CREATE INDEX "SectionInstructor_sectionId_idx" ON "public"."SectionInstructor"("sectionId");

-- CreateIndex
CREATE INDEX "idx_section" ON "public"."SectionGroup"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_group_section" ON "public"."SectionGroup"("id", "sectionId");

-- CreateIndex
CREATE INDEX "SectionEnrollment_studentId_idx" ON "public"."SectionEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "SectionEnrollment_sectionId_idx" ON "public"."SectionEnrollment"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_section_student" ON "public"."SectionEnrollment"("sectionId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSection" ADD CONSTRAINT "CourseSection_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSection" ADD CONSTRAINT "CourseSection_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionInstructor" ADD CONSTRAINT "SectionInstructor_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionInstructor" ADD CONSTRAINT "SectionInstructor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionGroup" ADD CONSTRAINT "SectionGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
