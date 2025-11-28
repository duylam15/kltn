-- CreateEnum
CREATE TYPE "public"."StudentStatus" AS ENUM ('active', 'suspended', 'graduated', 'dropped');

-- CreateEnum
CREATE TYPE "public"."CourseSectionStatus" AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."InstructorRole" AS ENUM ('owner', 'co', 'ta');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('enrolled', 'dropped', 'completed');

-- CreateEnum
CREATE TYPE "public"."MaterialCategory" AS ENUM ('lecture', 'slide', 'exercise', 'reference', 'syllabus', 'other');

-- CreateEnum
CREATE TYPE "public"."AssignmentType" AS ENUM ('exercise', 'quiz', 'project', 'exam');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('multiple_choice', 'essay', 'coding', 'true_false');

-- CreateEnum
CREATE TYPE "public"."ProgrammingLanguage" AS ENUM ('javascript', 'python', 'java', 'cpp', 'csharp', 'php', 'html', 'css');

-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "public"."JudgeStatus" AS ENUM ('queued', 'running', 'passed', 'failed', 'compile_error', 'runtime_error', 'timeout');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('present', 'late', 'absent', 'warning');

-- CreateEnum
CREATE TYPE "public"."GradeColumnType" AS ENUM ('attendance', 'assignment', 'midterm', 'final', 'participation', 'project', 'custom');

-- CreateEnum
CREATE TYPE "public"."GradeCalculationMethod" AS ENUM ('average', 'weighted_average', 'sum', 'best_n', 'latest', 'highest', 'percentage');

-- CreateEnum
CREATE TYPE "public"."ChatRoomType" AS ENUM ('private', 'section', 'group', 'assignment');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('system', 'chat', 'assignment', 'section');

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "groupName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
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
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "studentCode" VARCHAR(30),
    "email" VARCHAR(100),
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
CREATE TABLE "public"."Subject" (
    "id" SERIAL NOT NULL,
    "subjectCode" VARCHAR(30) NOT NULL,
    "subjectName" VARCHAR(200) NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT,

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
    "sectionCode" TEXT NOT NULL,
    "sectionName" TEXT,
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
    "groupId" INTEGER,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileType" TEXT,
    "originalMaterialId" VARCHAR(100) NOT NULL,
    "category" "public"."MaterialCategory" NOT NULL DEFAULT 'other',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "link" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseMaterial" (
    "id" SERIAL NOT NULL,
    "courseSectionId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "assignedBy" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "public"."AssignmentType" NOT NULL DEFAULT 'exercise',
    "dueDate" TIMESTAMP(3),
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passingScore" DOUBLE PRECISION,
    "timeLimit" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER DEFAULT 1,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "showAnswersAfterSubmit" BOOLEAN NOT NULL DEFAULT false,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "originalAssignmentId" VARCHAR(100) NOT NULL,
    "subjectId" INTEGER,
    "chapterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectionAssignment" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SectionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "subjectId" INTEGER,
    "chapterId" INTEGER,
    "difficulty" "public"."DifficultyLevel" NOT NULL DEFAULT 'medium',
    "tags" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "language" "public"."ProgrammingLanguage",
    "starterCode" TEXT,
    "timeLimit" INTEGER,
    "memoryLimit" INTEGER,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentQuestion" (
    "assignmentId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentQuestion_pkey" PRIMARY KEY ("assignmentId","questionId")
);

-- CreateTable
CREATE TABLE "public"."QuestionChoice" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chapter" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "chapterCode" VARCHAR(30) NOT NULL,
    "chapterName" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TestCase" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "filePath" VARCHAR(500),
    "answerText" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "autoGraded" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubmissionAnswer" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "codeAnswer" TEXT,
    "language" "public"."ProgrammingLanguage",
    "filePath" VARCHAR(500),
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "selectedChoices" INTEGER[],
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "judgeStatus" "public"."JudgeStatus" NOT NULL DEFAULT 'queued',
    "compileLog" TEXT,
    "stdoutLog" TEXT,
    "stderrLog" TEXT,
    "testResults" JSONB,

    CONSTRAINT "SubmissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceSession" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" TEXT,
    "sessionCode" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "requireDeviceCheck" BOOLEAN NOT NULL DEFAULT true,
    "maxCheckInsPerIP" INTEGER NOT NULL DEFAULT 3,
    "allowedDevices" JSONB,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'present',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "ipAddress" VARCHAR(45),
    "deviceInfo" VARCHAR(255),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "userAgent" VARCHAR(500),
    "score" DOUBLE PRECISION,
    "adjustedBy" INTEGER,
    "adjustedAt" TIMESTAMP(3),
    "totpSecretBase32" TEXT,
    "totpPeriod" INTEGER DEFAULT 10,
    "totpDigits" INTEGER DEFAULT 6,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceScoreRule" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceScoreRule_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."GradeColumn" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "public"."GradeColumnType" NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weight" DOUBLE PRECISION,
    "calculationMethod" "public"."GradeCalculationMethod" NOT NULL DEFAULT 'average',
    "bestNCount" INTEGER,
    "dropLowest" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAttendanceSession" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnAssignment" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentGrade" (
    "id" SERIAL NOT NULL,
    "gradeColumnId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "note" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overriddenScore" DOUBLE PRECISION,
    "overriddenAt" TIMESTAMP(3),
    "overriddenBy" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeColumnLink" (
    "id" SERIAL NOT NULL,
    "parentColumnId" INTEGER NOT NULL,
    "childColumnId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeColumnLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumThread" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumPost" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200),
    "type" "public"."ChatRoomType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sectionId" INTEGER,
    "assignmentId" INTEGER,
    "groupId" INTEGER,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatParticipant" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'system',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatMessageId" INTEGER,
    "assignmentId" INTEGER,
    "sectionId" INTEGER,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reminder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" VARCHAR(200) NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningPath" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningItem" (
    "id" SERIAL NOT NULL,
    "learningPathId" INTEGER NOT NULL,
    "resourceType" VARCHAR(50) NOT NULL,
    "resourceUrl" VARCHAR(500),
    "recommendationNote" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" VARCHAR(200) NOT NULL,
    "target" VARCHAR(200),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "public"."RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_revokedAt_idx" ON "public"."RefreshToken"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentCode_key" ON "public"."User"("studentCode");

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
CREATE UNIQUE INDEX "Subject_subjectCode_key" ON "public"."Subject"("subjectCode");

-- CreateIndex
CREATE INDEX "Subject_subjectCode_idx" ON "public"."Subject"("subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "Term_code_key" ON "public"."Term"("code");

-- CreateIndex
CREATE INDEX "Term_code_idx" ON "public"."Term"("code");

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
CREATE INDEX "SubjectInstructor_teacherId_idx" ON "public"."SubjectInstructor"("teacherId");

-- CreateIndex
CREATE INDEX "SubjectInstructor_subjectId_idx" ON "public"."SubjectInstructor"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectInstructor_isActive_idx" ON "public"."SubjectInstructor"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectInstructor_subjectId_teacherId_key" ON "public"."SubjectInstructor"("subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "idx_section" ON "public"."SectionGroup"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_group_section" ON "public"."SectionGroup"("id", "sectionId");

-- CreateIndex
CREATE INDEX "SectionEnrollment_studentId_idx" ON "public"."SectionEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "SectionEnrollment_sectionId_idx" ON "public"."SectionEnrollment"("sectionId");

-- CreateIndex
CREATE INDEX "SectionEnrollment_groupId_idx" ON "public"."SectionEnrollment"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_section_student" ON "public"."SectionEnrollment"("sectionId", "studentId");

-- CreateIndex
CREATE INDEX "CourseMaterial_assignedBy_idx" ON "public"."CourseMaterial"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "CourseMaterial_courseSectionId_materialId_key" ON "public"."CourseMaterial"("courseSectionId", "materialId");

-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "public"."Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_chapterId_idx" ON "public"."Assignment"("chapterId");

-- CreateIndex
CREATE INDEX "SectionAssignment_assignmentId_idx" ON "public"."SectionAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionAssignment_sectionId_assignmentId_key" ON "public"."SectionAssignment"("sectionId", "assignmentId");

-- CreateIndex
CREATE INDEX "Question_createdBy_idx" ON "public"."Question"("createdBy");

-- CreateIndex
CREATE INDEX "Question_subjectId_idx" ON "public"."Question"("subjectId");

-- CreateIndex
CREATE INDEX "Question_chapterId_idx" ON "public"."Question"("chapterId");

-- CreateIndex
CREATE INDEX "QuestionChoice_questionId_idx" ON "public"."QuestionChoice"("questionId");

-- CreateIndex
CREATE INDEX "Chapter_subjectId_idx" ON "public"."Chapter"("subjectId");

-- CreateIndex
CREATE INDEX "Chapter_chapterCode_idx" ON "public"."Chapter"("chapterCode");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subjectId_chapterCode_key" ON "public"."Chapter"("subjectId", "chapterCode");

-- CreateIndex
CREATE INDEX "TestCase_questionId_idx" ON "public"."TestCase"("questionId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "public"."Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "public"."Submission"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_sessionCode_key" ON "public"."AttendanceSession"("sessionCode");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_attendance" ON "public"."Attendance"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_section_status_rule" ON "public"."AttendanceScoreRule"("sectionId", "status");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_studentId_idx" ON "public"."DeviceFingerprint"("studentId");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_sessionId_idx" ON "public"."DeviceFingerprint"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_sessionId_deviceId_key" ON "public"."DeviceFingerprint"("sessionId", "deviceId");

-- CreateIndex
CREATE INDEX "GradeColumn_sectionId_idx" ON "public"."GradeColumn"("sectionId");

-- CreateIndex
CREATE INDEX "GradeColumnAttendanceSession_sessionId_idx" ON "public"."GradeColumnAttendanceSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAttendanceSession_gradeColumnId_sessionId_key" ON "public"."GradeColumnAttendanceSession"("gradeColumnId", "sessionId");

-- CreateIndex
CREATE INDEX "GradeColumnAssignment_assignmentId_idx" ON "public"."GradeColumnAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnAssignment_gradeColumnId_assignmentId_key" ON "public"."GradeColumnAssignment"("gradeColumnId", "assignmentId");

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_idx" ON "public"."StudentGrade"("studentId");

-- CreateIndex
CREATE INDEX "StudentGrade_gradeColumnId_idx" ON "public"."StudentGrade"("gradeColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_gradeColumnId_studentId_key" ON "public"."StudentGrade"("gradeColumnId", "studentId");

-- CreateIndex
CREATE INDEX "GradeColumnLink_childColumnId_idx" ON "public"."GradeColumnLink"("childColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeColumnLink_parentColumnId_childColumnId_key" ON "public"."GradeColumnLink"("parentColumnId", "childColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_userId_key" ON "public"."ChatParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSection" ADD CONSTRAINT "CourseSection_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSection" ADD CONSTRAINT "CourseSection_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionInstructor" ADD CONSTRAINT "SectionInstructor_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionInstructor" ADD CONSTRAINT "SectionInstructor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubjectInstructor" ADD CONSTRAINT "SubjectInstructor_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubjectInstructor" ADD CONSTRAINT "SubjectInstructor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionGroup" ADD CONSTRAINT "SectionGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionEnrollment" ADD CONSTRAINT "SectionEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."SectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMaterial" ADD CONSTRAINT "CourseMaterial_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionAssignment" ADD CONSTRAINT "SectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionAssignment" ADD CONSTRAINT "SectionAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestion" ADD CONSTRAINT "AssignmentQuestion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestion" ADD CONSTRAINT "AssignmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionChoice" ADD CONSTRAINT "QuestionChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceSession" ADD CONSTRAINT "AttendanceSession_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceScoreRule" ADD CONSTRAINT "AttendanceScoreRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "public"."GradeColumn" ADD CONSTRAINT "GradeColumn_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAttendanceSession" ADD CONSTRAINT "GradeColumnAttendanceSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnAssignment" ADD CONSTRAINT "GradeColumnAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_gradeColumnId_fkey" FOREIGN KEY ("gradeColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGrade" ADD CONSTRAINT "StudentGrade_overriddenBy_fkey" FOREIGN KEY ("overriddenBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnLink" ADD CONSTRAINT "GradeColumnLink_parentColumnId_fkey" FOREIGN KEY ("parentColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeColumnLink" ADD CONSTRAINT "GradeColumnLink_childColumnId_fkey" FOREIGN KEY ("childColumnId") REFERENCES "public"."GradeColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumThread" ADD CONSTRAINT "ForumThread_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumThread" ADD CONSTRAINT "ForumThread_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumPost" ADD CONSTRAINT "ForumPost_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."SectionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "public"."ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningPath" ADD CONSTRAINT "LearningPath_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningItem" ADD CONSTRAINT "LearningItem_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "public"."LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
