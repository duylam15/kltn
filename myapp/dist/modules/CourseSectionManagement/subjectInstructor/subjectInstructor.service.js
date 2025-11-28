"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTeachersFromSubject = exports.getSubjectTeachers = exports.bulkAssignTeachers = exports.bulkAssignSubjects = exports.getTeacherSubjects = exports.deleteSubjectInstructor = exports.updateSubjectInstructor = exports.getSubjectInstructor = exports.listSubjectInstructors = exports.assignSubjectToTeacher = void 0;
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
const assignSubjectToTeacher = async (data) => {
    // Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(400, "Subject not found");
    // Kiểm tra teacher tồn tại
    const teacher = await client_1.prisma.teacher.findUnique({
        where: { id: data.teacherId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
    if (!teacher)
        throw new ApiError_1.default(400, "Teacher not found");
    // Kiểm tra đã được phân công chưa
    const existingAssignment = await client_1.prisma.subjectInstructor.findUnique({
        where: {
            subjectId_teacherId: {
                subjectId: data.subjectId,
                teacherId: data.teacherId,
            },
        },
    });
    if (existingAssignment) {
        throw new ApiError_1.default(409, "Teacher already assigned to this subject");
    }
    // Tạo phân công mới
    return client_1.prisma.subjectInstructor.create({
        data: {
            subjectId: data.subjectId,
            teacherId: data.teacherId,
            role: data.role || "owner",
            assignedBy: data.assignedBy,
        },
        include: {
            subject: true,
            teacher: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                        },
                    },
                },
            },
        },
    });
};
exports.assignSubjectToTeacher = assignSubjectToTeacher;
const listSubjectInstructors = async (params) => {
    const where = {};
    if (params.subjectId)
        where.subjectId = params.subjectId;
    if (params.teacherId)
        where.teacherId = params.teacherId;
    if (params.role)
        where.role = params.role;
    if (params.isActive !== undefined)
        where.isActive = params.isActive;
    // Filter by subject code
    if (params.subjectCode) {
        where.subject = {
            subjectCode: {
                contains: params.subjectCode,
                mode: "insensitive",
            },
        };
    }
    // Filter by teacher department
    if (params.department) {
        where.teacher = {
            department: {
                contains: params.department,
                mode: "insensitive",
            },
        };
    }
    const [items, total] = await Promise.all([
        client_1.prisma.subjectInstructor.findMany({
            where,
            include: {
                subject: {
                    include: {
                        _count: {
                            select: {
                                courseSections: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.subjectInstructor.count({ where }),
    ]);
    return { items, total };
};
exports.listSubjectInstructors = listSubjectInstructors;
const getSubjectInstructor = (subjectId, teacherId) => client_1.prisma.subjectInstructor.findUnique({
    where: {
        subjectId_teacherId: {
            subjectId,
            teacherId,
        },
    },
    include: {
        subject: {
            include: {
                courseSections: {
                    where: {
                        instructors: {
                            some: {
                                teacherId,
                            },
                        },
                    },
                    include: {
                        term: true,
                        _count: {
                            select: {
                                enrollments: true,
                            },
                        },
                    },
                },
            },
        },
        teacher: {
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
            },
        },
    },
});
exports.getSubjectInstructor = getSubjectInstructor;
const updateSubjectInstructor = (subjectId, teacherId, data) => client_1.prisma.subjectInstructor.update({
    where: {
        subjectId_teacherId: {
            subjectId,
            teacherId,
        },
    },
    data,
    include: {
        subject: true,
        teacher: {
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        },
    },
});
exports.updateSubjectInstructor = updateSubjectInstructor;
const deleteSubjectInstructor = async (subjectId, teacherId) => {
    // Kiểm tra xem giáo viên có đang dạy section nào của môn học này không
    const activeSections = await client_1.prisma.courseSection.count({
        where: {
            subjectId,
            instructors: {
                some: {
                    teacherId,
                },
            },
            status: {
                in: ["planned", "ongoing"],
            },
        },
    });
    if (activeSections > 0) {
        throw new ApiError_1.default(400, `Cannot remove assignment. Teacher is currently teaching ${activeSections} section(s) of this subject.`);
    }
    return client_1.prisma.subjectInstructor.delete({
        where: {
            subjectId_teacherId: {
                subjectId,
                teacherId,
            },
        },
    });
};
exports.deleteSubjectInstructor = deleteSubjectInstructor;
const getTeacherSubjects = async (teacherId) => {
    return client_1.prisma.subjectInstructor.findMany({
        where: {
            teacherId,
            isActive: true,
        },
        include: {
            subject: {
                include: {
                    _count: {
                        select: {
                            courseSections: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            assignedAt: "desc",
        },
    });
};
exports.getTeacherSubjects = getTeacherSubjects;
const bulkAssignSubjects = async (data) => {
    const { teacherId, subjectIds, role = "owner", assignedBy } = data;
    // Kiểm tra teacher tồn tại
    const teacher = await client_1.prisma.teacher.findUnique({
        where: { id: teacherId },
    });
    if (!teacher)
        throw new ApiError_1.default(400, "Teacher not found");
    // Kiểm tra subjects tồn tại
    const subjects = await client_1.prisma.subject.findMany({
        where: { id: { in: subjectIds } },
    });
    if (subjects.length !== subjectIds.length) {
        throw new ApiError_1.default(400, "Some subjects not found");
    }
    // Lọc ra những subject chưa được phân công
    const existingAssignments = await client_1.prisma.subjectInstructor.findMany({
        where: {
            teacherId,
            subjectId: { in: subjectIds },
        },
        select: { subjectId: true },
    });
    const existingSubjectIds = new Set(existingAssignments.map((a) => a.subjectId));
    const newSubjectIds = subjectIds.filter((id) => !existingSubjectIds.has(id));
    if (newSubjectIds.length === 0) {
        throw new ApiError_1.default(400, "All subjects already assigned to this teacher");
    }
    // Tạo phân công hàng loạt
    const result = await client_1.prisma.subjectInstructor.createMany({
        data: newSubjectIds.map((subjectId) => ({
            subjectId,
            teacherId,
            role,
            assignedBy,
        })),
    });
    return {
        created: result.count,
        skipped: existingSubjectIds.size,
        total: subjectIds.length,
    };
};
exports.bulkAssignSubjects = bulkAssignSubjects;
const bulkAssignTeachers = async (data) => {
    const { subjectId, teacherIds, role = "owner", assignedBy } = data;
    // Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(400, "Subject not found");
    // Kiểm tra teachers tồn tại
    const teachers = await client_1.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
    if (teachers.length !== teacherIds.length) {
        const foundIds = new Set(teachers.map((t) => t.id));
        const missingIds = teacherIds.filter((id) => !foundIds.has(id));
        throw new ApiError_1.default(400, `Teachers not found: ${missingIds.join(", ")}`);
    }
    // Lọc ra những teacher chưa được phân công
    const existingAssignments = await client_1.prisma.subjectInstructor.findMany({
        where: {
            subjectId,
            teacherId: { in: teacherIds },
        },
        select: { teacherId: true },
    });
    const existingTeacherIds = new Set(existingAssignments.map((a) => a.teacherId));
    const newTeacherIds = teacherIds.filter((id) => !existingTeacherIds.has(id));
    if (newTeacherIds.length === 0) {
        throw new ApiError_1.default(400, "All teachers are already assigned to this subject");
    }
    // Tạo phân công hàng loạt
    const result = await client_1.prisma.subjectInstructor.createMany({
        data: newTeacherIds.map((teacherId) => ({
            subjectId,
            teacherId,
            role,
            assignedBy,
        })),
    });
    // Lấy thông tin chi tiết các phân công vừa tạo
    const createdAssignments = await client_1.prisma.subjectInstructor.findMany({
        where: {
            subjectId,
            teacherId: { in: newTeacherIds },
        },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                        },
                    },
                },
            },
        },
    });
    return {
        created: result.count,
        skipped: existingTeacherIds.size,
        total: teacherIds.length,
        subject: {
            id: subject.id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
        },
        assignments: createdAssignments,
        skippedTeachers: teachers
            .filter((t) => existingTeacherIds.has(t.id))
            .map((t) => ({
            id: t.id,
            teacherCode: t.teacherCode,
            fullName: t.user.fullName,
            reason: "Already assigned",
        })),
    };
};
exports.bulkAssignTeachers = bulkAssignTeachers;
const getSubjectTeachers = async (subjectId) => {
    // Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(404, "Subject not found");
    const assignments = await client_1.prisma.subjectInstructor.findMany({
        where: {
            subjectId,
            isActive: true,
        },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ role: "asc" }, { assignedAt: "desc" }],
    });
    return {
        subject: {
            id: subject.id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            credits: subject.credits,
        },
        teachers: assignments.map((a) => ({
            assignmentId: `${a.subjectId}-${a.teacherId}`,
            role: a.role,
            assignedAt: a.assignedAt,
            teacher: {
                id: a.teacher.id,
                teacherCode: a.teacher.teacherCode,
                department: a.teacher.department,
                position: a.teacher.position,
                specialization: a.teacher.specialization,
                user: a.teacher.user,
            },
        })),
        totalTeachers: assignments.length,
    };
};
exports.getSubjectTeachers = getSubjectTeachers;
const removeTeachersFromSubject = async (data) => {
    const { subjectId, teacherIds } = data;
    // Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(404, "Subject not found");
    // Kiểm tra xem có giáo viên nào đang dạy section của môn này không
    const teachersWithActiveSections = await client_1.prisma.courseSection.findMany({
        where: {
            subjectId,
            instructors: {
                some: {
                    teacherId: { in: teacherIds },
                },
            },
            status: {
                in: ["planned", "ongoing"],
            },
        },
        include: {
            instructors: {
                where: {
                    teacherId: { in: teacherIds },
                },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (teachersWithActiveSections.length > 0) {
        const conflicts = teachersWithActiveSections.map((section) => ({
            sectionCode: section.sectionCode,
            teachers: section.instructors.map((i) => i.teacher.user.fullName),
        }));
        throw new ApiError_1.default(400, `Cannot remove teachers. They are teaching active sections: ${JSON.stringify(conflicts)}`);
    }
    // Xóa phân công
    const result = await client_1.prisma.subjectInstructor.deleteMany({
        where: {
            subjectId,
            teacherId: { in: teacherIds },
        },
    });
    return {
        removed: result.count,
        subjectId,
        teacherIds,
    };
};
exports.removeTeachersFromSubject = removeTeachersFromSubject;
