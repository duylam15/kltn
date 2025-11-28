"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionsByDifficulty = exports.getQuestionStatsByDifficulty = exports.deleteChapter = exports.updateChapter = exports.getChapter = exports.listChapters = exports.createChapter = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createChapter = async (data) => {
    // Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(404, "Question subject not found");
    // Kiểm tra trùng chapterCode trong cùng subject
    const existingChapter = await client_1.prisma.chapter.findFirst({
        where: {
            subjectId: data.subjectId,
            chapterCode: data.chapterCode,
        },
    });
    if (existingChapter)
        throw new ApiError_1.default(409, "Chapter code already exists in this subject");
    return client_1.prisma.chapter.create({
        data: {
            subjectId: data.subjectId,
            chapterCode: data.chapterCode,
            chapterName: data.chapterName,
            description: data.description,
            order: data.order || 0,
        },
        include: {
            subject: true,
        },
    });
};
exports.createChapter = createChapter;
const listChapters = async (params) => {
    const where = {};
    if (params.subjectId) {
        where.subjectId = params.subjectId;
    }
    if (params.q) {
        where.OR = [
            { chapterCode: { contains: params.q, mode: "insensitive" } },
            { chapterName: { contains: params.q, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        client_1.prisma.chapter.findMany({
            where,
            orderBy: [{ subjectId: "asc" }, { order: "asc" }],
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            include: {
                subject: true,
                _count: {
                    select: {
                        questions: true,
                    },
                },
            },
        }),
        client_1.prisma.chapter.count({ where }),
    ]);
    return { items, total };
};
exports.listChapters = listChapters;
const getChapter = (id) => client_1.prisma.chapter.findUnique({
    where: { id },
    include: {
        subject: true,
        _count: {
            select: {
                questions: true,
            },
        },
    },
});
exports.getChapter = getChapter;
const updateChapter = (id, data) => client_1.prisma.chapter.update({
    where: { id },
    data,
    include: {
        subject: true,
    },
});
exports.updateChapter = updateChapter;
const deleteChapter = (id) => client_1.prisma.chapter.delete({ where: { id } });
exports.deleteChapter = deleteChapter;
// 🆕 Thống kê số câu hỏi theo độ khó
const getQuestionStatsByDifficulty = async (chapterId) => {
    const stats = await client_1.prisma.question.groupBy({
        by: ["difficulty"],
        where: { chapterId },
        _count: {
            id: true,
        },
    });
    return {
        easy: stats.find((s) => s.difficulty === "easy")?._count.id || 0,
        medium: stats.find((s) => s.difficulty === "medium")?._count.id || 0,
        hard: stats.find((s) => s.difficulty === "hard")?._count.id || 0,
        total: stats.reduce((sum, s) => sum + s._count.id, 0),
    };
};
exports.getQuestionStatsByDifficulty = getQuestionStatsByDifficulty;
// 🆕 Lấy câu hỏi theo độ khó
const getQuestionsByDifficulty = async (chapterId, difficulty, limit) => {
    const where = { chapterId };
    if (difficulty) {
        where.difficulty = difficulty;
    }
    return client_1.prisma.question.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            type: true,
            content: true,
            difficulty: true,
            points: true,
            createdAt: true,
        },
    });
};
exports.getQuestionsByDifficulty = getQuestionsByDifficulty;
