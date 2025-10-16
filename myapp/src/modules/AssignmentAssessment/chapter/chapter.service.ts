import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";
import { DifficultyLevel } from "@prisma/client";

export const createChapter = async (data: {
    subjectId: number;
    chapterCode: string;
    chapterName: string;
    description?: string;
    order?: number;
}) => {
    // Kiểm tra subject tồn tại
    const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject) throw new ApiError(404, "Question subject not found");

    // Kiểm tra trùng chapterCode trong cùng subject
    const existingChapter = await prisma.chapter.findFirst({
        where: {
            subjectId: data.subjectId,
            chapterCode: data.chapterCode,
        },
    });
    if (existingChapter)
        throw new ApiError(409, "Chapter code already exists in this subject");

    return prisma.chapter.create({
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

export const listChapters = async (params: {
    page: number;
    limit: number;
    subjectId?: number;
    q?: string;
}) => {
    const where: any = {};

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
        prisma.chapter.findMany({
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
        prisma.chapter.count({ where }),
    ]);

    return { items, total };
};

export const getChapter = (id: number) =>
    prisma.chapter.findUnique({
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

export const updateChapter = (
    id: number,
    data: {
        chapterCode?: string;
        chapterName?: string;
        description?: string;
        order?: number;
    }
) =>
    prisma.chapter.update({
        where: { id },
        data,
        include: {
            subject: true,
        },
    });

export const deleteChapter = (id: number) =>
    prisma.chapter.delete({ where: { id } });

// 🆕 Thống kê số câu hỏi theo độ khó
export const getQuestionStatsByDifficulty = async (chapterId: number) => {
    const stats = await prisma.question.groupBy({
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

// 🆕 Lấy câu hỏi theo độ khó
export const getQuestionsByDifficulty = async (
    chapterId: number,
    difficulty?: DifficultyLevel,
    limit?: number
) => {
    const where: any = { chapterId };
    if (difficulty) {
        where.difficulty = difficulty;
    }

    return prisma.question.findMany({
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
