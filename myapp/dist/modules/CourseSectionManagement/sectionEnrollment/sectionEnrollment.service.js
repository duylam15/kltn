"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSectionEnrollment = exports.updateSectionEnrollment = exports.getSectionEnrollment = exports.listSectionEnrollments = exports.createSectionEnrollment = void 0;
exports.getStudentsBySection = getStudentsBySection;
exports.getStudentsByGroup = getStudentsByGroup;
exports.getGroupsWithMembers = getGroupsWithMembers;
exports.getSectionsByStudent = getSectionsByStudent;
exports.getCoursesByStudent = getCoursesByStudent;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createSectionEnrollment = async (data) => {
    const section = await client_1.prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section)
        throw new ApiError_1.default(400, "Course section not found");
    const student = await client_1.prisma.student.findUnique({
        where: { id: data.studentId },
    });
    if (!student)
        throw new ApiError_1.default(400, "Student not found");
    const existingEnrollment = await client_1.prisma.sectionEnrollment.findUnique({
        where: {
            sectionId_studentId: {
                sectionId: data.sectionId,
                studentId: data.studentId,
            },
        },
    });
    if (existingEnrollment)
        throw new ApiError_1.default(409, "Student already enrolled in this section");
    // Check if section is full
    if (section.currentStudents >= section.maxStudents) {
        throw new ApiError_1.default(400, "Section is full");
    }
    // Create enrollment and update current students count
    const enrollment = await client_1.prisma.$transaction(async (tx) => {
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
exports.createSectionEnrollment = createSectionEnrollment;
const listSectionEnrollments = async (params) => {
    const where = {};
    if (params.sectionId)
        where.sectionId = params.sectionId;
    if (params.studentId)
        where.studentId = params.studentId;
    if (params.status)
        where.status = params.status;
    const [items, total] = await Promise.all([
        client_1.prisma.sectionEnrollment.findMany({
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
        client_1.prisma.sectionEnrollment.count({ where }),
    ]);
    return { items, total };
};
exports.listSectionEnrollments = listSectionEnrollments;
const getSectionEnrollment = (id) => client_1.prisma.sectionEnrollment.findUnique({
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
exports.getSectionEnrollment = getSectionEnrollment;
const updateSectionEnrollment = async (id, data) => {
    const enrollment = await client_1.prisma.sectionEnrollment.findUnique({
        where: { id },
        include: { section: true },
    });
    if (!enrollment)
        throw new ApiError_1.default(404, "Enrollment not found");
    // Handle status changes that affect student count
    const result = await client_1.prisma.$transaction(async (tx) => {
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
            if (data.status === "enrolled" &&
                enrollment.status !== "enrolled") {
                await tx.courseSection.update({
                    where: { id: enrollment.sectionId },
                    data: { currentStudents: { increment: 1 } },
                });
            }
            else if (data.status !== "enrolled" &&
                enrollment.status === "enrolled") {
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
exports.updateSectionEnrollment = updateSectionEnrollment;
const deleteSectionEnrollment = async (id) => {
    const enrollment = await client_1.prisma.sectionEnrollment.findUnique({
        where: { id },
    });
    if (!enrollment)
        throw new ApiError_1.default(404, "Enrollment not found");
    await client_1.prisma.$transaction(async (tx) => {
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
exports.deleteSectionEnrollment = deleteSectionEnrollment;
async function getStudentsBySection(sectionId) {
    return client_1.prisma.sectionEnrollment.findMany({
        where: { sectionId },
        include: {
            student: { include: { user: true } },
        },
    });
}
async function getStudentsByGroup(sectionId, groupId) {
    return client_1.prisma.sectionEnrollment.findMany({
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
async function getGroupsWithMembers(sectionId) {
    return client_1.prisma.sectionGroup.findMany({
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
async function getSectionsByStudent(studentId) {
    return client_1.prisma.sectionEnrollment.findMany({
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
async function getCoursesByStudent(studentId) {
    return client_1.prisma.sectionEnrollment.findMany({
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
