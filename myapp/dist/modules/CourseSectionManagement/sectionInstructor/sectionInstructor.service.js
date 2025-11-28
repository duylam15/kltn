"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSectionInstructor = exports.updateSectionInstructor = exports.getSectionInstructor = exports.listSectionInstructors = exports.createSectionInstructor = void 0;
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
const createSectionInstructor = async (data) => {
    const section = await client_1.prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section)
        throw new ApiError_1.default(400, "Course section not found");
    const teacher = await client_1.prisma.teacher.findUnique({
        where: { id: data.teacherId },
    });
    if (!teacher)
        throw new ApiError_1.default(400, "Teacher not found");
    const existingAssignment = await client_1.prisma.sectionInstructor.findUnique({
        where: {
            sectionId_teacherId: {
                sectionId: data.sectionId,
                teacherId: data.teacherId,
            },
        },
    });
    if (existingAssignment)
        throw new ApiError_1.default(409, "Teacher already assigned to this section");
    return client_1.prisma.sectionInstructor.create({
        data: {
            sectionId: data.sectionId,
            teacherId: data.teacherId,
            role: data.role || "owner",
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
            teacher: {
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                },
            },
        },
    });
};
exports.createSectionInstructor = createSectionInstructor;
const listSectionInstructors = async (params) => {
    const where = {};
    if (params.sectionId)
        where.sectionId = params.sectionId;
    if (params.teacherId)
        where.teacherId = params.teacherId;
    if (params.role)
        where.role = params.role;
    const [items, total] = await Promise.all([
        client_1.prisma.sectionInstructor.findMany({
            where,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.sectionInstructor.count({ where }),
    ]);
    return { items, total };
};
exports.listSectionInstructors = listSectionInstructors;
const getSectionInstructor = (sectionId, teacherId) => client_1.prisma.sectionInstructor.findUnique({
    where: {
        sectionId_teacherId: {
            sectionId,
            teacherId,
        },
    },
    include: {
        section: {
            include: {
                subject: true,
                term: true,
            },
        },
        teacher: {
            include: {
                user: { select: { id: true, email: true, fullName: true } },
            },
        },
    },
});
exports.getSectionInstructor = getSectionInstructor;
const updateSectionInstructor = (sectionId, teacherId, data) => client_1.prisma.sectionInstructor.update({
    where: {
        sectionId_teacherId: {
            sectionId,
            teacherId,
        },
    },
    data,
    include: {
        section: {
            include: {
                subject: true,
                term: true,
            },
        },
        teacher: {
            include: {
                user: { select: { id: true, email: true, fullName: true } },
            },
        },
    },
});
exports.updateSectionInstructor = updateSectionInstructor;
const deleteSectionInstructor = (sectionId, teacherId) => client_1.prisma.sectionInstructor.delete({
    where: {
        sectionId_teacherId: {
            sectionId,
            teacherId,
        },
    },
});
exports.deleteSectionInstructor = deleteSectionInstructor;
