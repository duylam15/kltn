"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubject = exports.updateSubject = exports.getSubject = exports.listSubjects = exports.createSubject = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createSubject = async (data) => {
    const existingSubject = await client_1.prisma.subject.findUnique({
        where: { subjectCode: data.subjectCode },
    });
    if (existingSubject)
        throw new ApiError_1.default(409, "Subject code already exists");
    return client_1.prisma.subject.create({
        data: {
            subjectCode: data.subjectCode,
            subjectName: data.subjectName,
            credits: data.credits || 3,
            // description: data.description || "",
        },
    });
};
exports.createSubject = createSubject;
const listSubjects = async (params) => {
    const where = {};
    if (params.q) {
        where.OR = [
            { subjectCode: { contains: params.q, mode: "insensitive" } },
            { subjectName: { contains: params.q, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        client_1.prisma.subject.findMany({
            where,
            orderBy: { subjectCode: "asc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            include: {
                chapters: {
                    orderBy: { order: "asc" },
                    include: {
                        _count: {
                            select: {
                                questions: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        chapters: true,
                        questions: true,
                    },
                },
            },
        }),
        client_1.prisma.subject.count({ where }),
    ]);
    return { items, total };
};
exports.listSubjects = listSubjects;
const getSubject = (id) => client_1.prisma.subject.findUnique({
    where: { id },
    include: {
        courseSections: {
            include: {
                term: true,
            },
        },
        chapters: {
            orderBy: { order: "asc" },
            include: {
                _count: {
                    select: {
                        questions: true,
                    },
                },
            },
        },
        _count: {
            select: {
                chapters: true,
                questions: true,
                courseSections: true,
            },
        },
    },
});
exports.getSubject = getSubject;
const updateSubject = (id, data) => client_1.prisma.subject.update({
    where: { id },
    data,
});
exports.updateSubject = updateSubject;
const deleteSubject = async (id) => {
    // Kiểm tra xem có chapters hoặc questions không
    const subject = await client_1.prisma.subject.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    chapters: true,
                    questions: true,
                    courseSections: true,
                },
            },
        },
    });
    if (!subject) {
        throw new ApiError_1.default(404, "Subject not found");
    }
    if (subject._count.courseSections > 0) {
        throw new ApiError_1.default(400, `Cannot delete subject. It has ${subject._count.courseSections} course section(s).`);
    }
    if (subject._count.chapters > 0 || subject._count.questions > 0) {
        throw new ApiError_1.default(400, `Cannot delete subject. It has ${subject._count.chapters} chapter(s) and ${subject._count.questions} question(s).`);
    }
    return client_1.prisma.subject.delete({ where: { id } });
};
exports.deleteSubject = deleteSubject;
