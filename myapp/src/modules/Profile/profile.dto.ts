// src/modules/Profile/profile.dto.ts
import { User } from "@prisma/client";

export function mapUserToProfile(user: any) {
  const roleName = user.role?.name as "STUDENT" | "TEACHER" | "ADMIN";

  const code =
    user.student?.studentCode ||
    user.teacher?.teacherCode ||
    user.studentCode ||
    null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    code,
    role: roleName,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    lastLogin: user.lastLogin,

    student: user.student
      ? {
          studentCode: user.student.studentCode,
          className: user.student.className,
          major: user.student.major,
          academicYear: user.student.academicYear,
          enrollmentYear: user.student.enrollmentYear,
          gpa: user.student.gpa,
          status: user.student.status,
        }
      : null,

    teacher: user.teacher
      ? {
          teacherCode: user.teacher.teacherCode,
          department: user.teacher.department,
          position: user.teacher.position,
          specialization: user.teacher.specialization,
        }
      : null,
  };
}
