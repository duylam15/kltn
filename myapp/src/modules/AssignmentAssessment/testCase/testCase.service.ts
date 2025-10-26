import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";

export const getTestCasesByQuestion = (questionId: number) => {
    return prisma.testCase.findMany({
        where: { questionId },
        orderBy: { order: "asc" },
    });
};

export const getPublicTestCases = (questionId: number) => {
    return prisma.testCase.findMany({
        where: { questionId, isHidden: false },
        orderBy: { order: "asc" },
    });
};

export const getTotalPoints = async (questionId: number) => {
    const result = await prisma.testCase.aggregate({
        where: { questionId },
        _sum: { points: true },
    });
    return result._sum.points || 0;
};


export const createTestCase = async (data: {
    questionId: number;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    points?: number;
    order?: number;
}) => {
    // kiểm tra question tồn tại
    const question = await prisma.question.findUnique({
        where: { id: data.questionId },
    });
    if (!question) throw new ApiError(404, "Question not found");

    return prisma.testCase.create({
        data: {
            questionId: data.questionId,
            input: data.input,
            expectedOutput: data.expectedOutput,
            isHidden: data.isHidden ?? false,
            points: data.points ?? 0,
            order: data.order ?? 0,
        },
    });
};

export const listTestCases = async (params: {
    page: number;
    limit: number;
    questionId?: number;
}) => {
    const where: any = {};
    if (params.questionId) where.questionId = params.questionId;

    const [items, total] = await Promise.all([
        prisma.testCase.findMany({
            where,
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            orderBy: { order: "asc" },
        }),
        prisma.testCase.count({ where }),
    ]);

    return { items, total };
};

export const getTestCase = (id: number) =>
    prisma.testCase.findUnique({ where: { id } });

export const updateTestCase = (
    id: number,
    data: {
        input?: string;
        expectedOutput?: string;
        isHidden?: boolean;
        points?: number;
        order?: number;
    }
) =>
    prisma.testCase.update({
        where: { id },
        data,
    });

export const deleteTestCase = (id: number) =>
    prisma.testCase.delete({ where: { id } });
