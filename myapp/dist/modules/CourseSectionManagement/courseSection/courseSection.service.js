"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseSection = exports.updateCourseSection = exports.getCourseSection = exports.listCourseSections = exports.createCourseSection = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createCourseSection = async (data) => {
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(400, "Subject not found");
    const term = await client_1.prisma.term.findUnique({ where: { id: data.termId } });
    if (!term)
        throw new ApiError_1.default(400, "Term not found");
    return client_1.prisma.courseSection.create({
        data: {
            subjectId: data.subjectId,
            termId: data.termId,
            sectionCode: data.sectionCode || "",
            sectionName: data.sectionName,
            schedule: data.schedule,
            maxStudents: Number(data.maxStudents) || 50,
            status: data.status || "planned",
        },
        include: {
            subject: true,
            term: true,
        },
    });
};
exports.createCourseSection = createCourseSection;
const listCourseSections = async (params) => {
    const where = {};
    if (params.status)
        where.status = params.status;
    if (params.subjectId)
        where.subjectId = params.subjectId;
    if (params.termId)
        where.termId = params.termId;
    if (params.q) {
        where.OR = [
            { sectionCode: { contains: params.q, mode: "insensitive" } },
            {
                subject: {
                    subjectCode: { contains: params.q, mode: "insensitive" },
                },
            },
            {
                subject: {
                    subjectName: { contains: params.q, mode: "insensitive" },
                },
            },
        ];
    }
    const items = await client_1.prisma.courseSection.findMany({
        where,
        include: {
            subject: true,
            term: true,
            instructors: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
            _count: {
                select: {
                    instructors: true,
                    groups: true,
                    enrollments: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return { items, total: items.length };
};
exports.listCourseSections = listCourseSections;
const getCourseSection = (id) => client_1.prisma.courseSection.findUnique({
    where: { id },
    include: {
        subject: true,
        term: true,
        instructors: {
            include: {
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
        },
        groups: true,
        enrollments: {
            include: {
                student: {
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
        },
    },
});
exports.getCourseSection = getCourseSection;
const updateCourseSection = (id, data) => client_1.prisma.courseSection.update({
    where: { id },
    data,
    include: {
        subject: true,
        term: true,
    },
});
exports.updateCourseSection = updateCourseSection;
const deleteCourseSection = (id) => client_1.prisma.courseSection.delete({ where: { id } });
exports.deleteCourseSection = deleteCourseSection;
