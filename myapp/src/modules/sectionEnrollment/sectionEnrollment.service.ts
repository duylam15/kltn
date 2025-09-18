import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";
import type { EnrollmentStatus } from "@prisma/client";

export const createSectionEnrollment = async (data: {
    sectionId: number;
    studentId: number;
    status?: EnrollmentStatus;
}) => {
    const section = await prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section) throw new ApiError(400, "Course section not found");

    const student = await prisma.student.findUnique({
        where: { id: data.studentId },
    });
    if (!student) throw new ApiError(400, "Student not found");

    const existingEnrollment = await prisma.sectionEnrollment.findUnique({
        where: {
            sectionId_studentId: {
                sectionId: data.sectionId,
                studentId: data.studentId,
            },
        },
    });
    if (existingEnrollment)
        throw new ApiError(409, "Student already enrolled in this section");

    // Check if section is full
    if (section.currentStudents >= section.maxStudents) {
        throw new ApiError(400, "Section is full");
    }

    // Create enrollment and update current students count
    const enrollment = await prisma.$transaction(async (tx) => {
        const newEnrollment = await tx.sectionEnrollment.create({
            data: {
                sectionId: data.sectionId,
                studentId: data.studentId,
                status: data.status || "enrolled",
            },
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
                student: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });

        await tx.courseSection.update({
            where: { id: data.sectionId },
            data: { currentStudents: { increment: 1 } },
        });

        return newEnrollment;
    });

    return enrollment;
};

export const listSectionEnrollments = async (params: {
    page: number;
    limit: number;
    sectionId?: number;
    studentId?: number;
    status?: EnrollmentStatus;
}) => {
    const where: any = {};
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.studentId) where.studentId = params.studentId;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
        prisma.sectionEnrollment.findMany({
            where,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
                student: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
            orderBy: { enrolledAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.sectionEnrollment.count({ where }),
    ]);

    return { items, total };
};

export const getSectionEnrollment = (id: number) =>
    prisma.sectionEnrollment.findUnique({
        where: { id },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
            student: {
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                },
            },
        },
    });

export const updateSectionEnrollment = async (
    id: number,
    data: {
        status?: EnrollmentStatus;
    }
) => {
    const enrollment = await prisma.sectionEnrollment.findUnique({
        where: { id },
        include: { section: true },
    });

    if (!enrollment) throw new ApiError(404, "Enrollment not found");

    // Handle status changes that affect student count
    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.sectionEnrollment.update({
            where: { id },
            data,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
                student: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });

        // Update current students count if status changed to/from enrolled
        if (data.status && data.status !== enrollment.status) {
            if (
                data.status === "enrolled" &&
                enrollment.status !== "enrolled"
            ) {
                await tx.courseSection.update({
                    where: { id: enrollment.sectionId },
                    data: { currentStudents: { increment: 1 } },
                });
            } else if (
                data.status !== "enrolled" &&
                enrollment.status === "enrolled"
            ) {
                await tx.courseSection.update({
                    where: { id: enrollment.sectionId },
                    data: { currentStudents: { decrement: 1 } },
                });
            }
        }

        return updated;
    });

    return result;
};

export const deleteSectionEnrollment = async (id: number) => {
    const enrollment = await prisma.sectionEnrollment.findUnique({
        where: { id },
    });

    if (!enrollment) throw new ApiError(404, "Enrollment not found");

    await prisma.$transaction(async (tx) => {
        await tx.sectionEnrollment.delete({ where: { id } });

        // Decrease current students count if student was enrolled
        if (enrollment.status === "enrolled") {
            await tx.courseSection.update({
                where: { id: enrollment.sectionId },
                data: { currentStudents: { decrement: 1 } },
            });
        }
    });
};

export async function getStudentsBySection(sectionId: number) {
    return prisma.sectionEnrollment.findMany({
        where: { sectionId },
        include: {
            student: { include: { user: true } },
        },
    });
}

export async function getStudentsByGroup(sectionId: number, groupId: number) {
    return prisma.sectionEnrollment.findMany({
        where: {
            sectionId,
            groupId, // 👈 dùng trực tiếp field groupId
        },
        include: {
            student: { include: { user: true } },
            group: true, // nếu muốn trả thêm thông tin group
        },
    });
}


export async function getGroupsWithMembers(sectionId: number) {
    return prisma.sectionGroup.findMany({
        where: { sectionId },
        include: {
            enrollments: {
                include: {
                    student: { include: { user: true } },
                },
            },
        },
    });
}

export async function getSectionsByStudent(studentId: number) {
    return prisma.sectionEnrollment.findMany({
        where: { studentId },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });
}
export async function getCoursesByStudent(studentId: number) {
    return prisma.sectionEnrollment.findMany({
        where: { studentId },
        include: {
            section: {
                include: {
                    subject: true, // hiển thị thông tin môn học
                    term: true, // kỳ học
                    instructors: {
                        include: {
                            teacher: {
                                include: { user: true }, // hiển thị thông tin giảng viên
                            },
                        },
                    },
                },
            },
        },
    });
}