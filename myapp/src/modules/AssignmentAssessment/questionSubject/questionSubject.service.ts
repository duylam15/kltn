import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";

export const createQuestionSubject = async (data: {
    subjectCode: string;
    subjectName: string;
    description?: string;
}) => {
    const existingSubject = await prisma.questionSubject.findUnique({
        where: { subjectCode: data.subjectCode },
    });
    if (existingSubject) throw new ApiError(409, "Subject code already exists");

    return prisma.questionSubject.create({
        data: {
            subjectCode: data.subjectCode,
            subjectName: data.subjectName,
            description: data.description,
        },
    });
};

export const listQuestionSubjects = async (params: {
    page: number;
    limit: number;
    q?: string;
}) => {
    const where: any = {};
    if (params.q) {
        where.OR = [
            { subjectCode: { contains: params.q, mode: "insensitive" } },
            { subjectName: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.questionSubject.findMany({
            where,
            orderBy: { subjectCode: "asc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            include: {
                _count: {
                    select: {
                        chapters: true,
                        questions: true,
                    },
                },
            },
        }),
        prisma.questionSubject.count({ where }),
    ]);

    return { items, total };
};

export const getQuestionSubject = (id: number) =>
    prisma.questionSubject.findUnique({
        where: { id },
        include: {
            chapters: {
                orderBy: { order: "asc" },
            },
            _count: {
                select: {
                    questions: true,
                },
            },
        },
    });

export const updateQuestionSubject = (
    id: number,
    data: {
        subjectCode?: string;
        subjectName?: string;
        description?: string;
    }
) =>
    prisma.questionSubject.update({
        where: { id },
        data,
    });

export const deleteQuestionSubject = (id: number) =>
    prisma.questionSubject.delete({ where: { id } });

// 🆕 Lấy danh sách chương theo môn học
export const getChaptersBySubject = (subjectId: number) =>
    prisma.chapter.findMany({
        where: { subjectId },
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: {
                    questions: true,
                },
            },
        },
    });
