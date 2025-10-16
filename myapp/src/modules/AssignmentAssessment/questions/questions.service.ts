import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";

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


// question.service.ts
export async function createQuestion(data: any) {
    // 🆕 Validate subjectId nếu có
    if (data.subjectId) {
        const subject = await prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new ApiError(404, "Question subject not found");
        }
    }

    // 🆕 Validate chapterId nếu có
    if (data.chapterId) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: data.chapterId },
        });
        if (!chapter) {
            throw new ApiError(404, "Chapter not found");
        }

        // Nếu có chapterId thì subjectId phải khớp với chapter
        if (data.subjectId && chapter.subjectId !== data.subjectId) {
            throw new ApiError(
                400,
                "Chapter does not belong to the specified subject"
            );
        }
    }

    return prisma.question.create({
        data: {
            type: data.type,
            content: data.content,
            explanation: data.explanation,
            points: data.points,
            order: data.order,

            // 🆕 Thêm các field mới
            subjectId: data.subjectId,
            chapterId: data.chapterId,
            difficulty: data.difficulty || "medium",
            tags: data.tags,

            language: data.language,
            starterCode: data.starterCode,
            timeLimit: data.timeLimit,
            memoryLimit: data.memoryLimit,

            choices: data.choices ? { create: data.choices } : undefined,
            testCases: data.testCases ? { create: data.testCases } : undefined,
        },
        include: {
            choices: true,
            testCases: true,
            subject: true, // 🆕 Include subject
            chapter: true, // 🆕 Include chapter
        },
    });
}

export async function updateQuestion(id: number, data: any) {
    // Kiểm tra question tồn tại
    const existing = await prisma.question.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new ApiError(404, "Question not found");
    }

    // 🆕 Validate subjectId nếu có
    if (data.subjectId !== undefined && data.subjectId !== null) {
        const subject = await prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new ApiError(404, "Question subject not found");
        }
    }

    // 🆕 Validate chapterId nếu có
    if (data.chapterId !== undefined && data.chapterId !== null) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: data.chapterId },
        });
        if (!chapter) {
            throw new ApiError(404, "Chapter not found");
        }
    }

    return prisma.question.update({
        where: { id },
        data: {
            type: data.type,
            content: data.content,
            explanation: data.explanation,
            points: data.points,
            order: data.order,

            // 🆕 Thêm các field mới
            subjectId: data.subjectId,
            chapterId: data.chapterId,
            difficulty: data.difficulty,
            tags: data.tags,

            language: data.language,
            starterCode: data.starterCode,
            timeLimit: data.timeLimit,
            memoryLimit: data.memoryLimit,

            choices: data.choices
                ? {
                      deleteMany: { questionId: id },
                      create: data.choices,
                  }
                : undefined,
            testCases: data.testCases
                ? {
                      deleteMany: { questionId: id },
                      create: data.testCases,
                  }
                : undefined,
        },
        include: {
            choices: true,
            testCases: true,
            subject: true,
            chapter: true,
        },
    });
}

export async function deleteQuestion(id: number) {
    const existing = await prisma.question.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new ApiError(404, "Question not found");
    }

    return prisma.question.delete({ where: { id } });
}

export async function getQuestionById(id: number) {
    const question = await prisma.question.findUnique({
        where: { id },
        include: {
            choices: true,
            testCases: true,
            subject: true, // 🆕 Include subject
            chapter: true, // 🆕 Include chapter
        },
    });

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    return question;
}

// 🆕 CẬP NHẬT: Cải thiện filter logic
export async function getAllQuestions(filter: any) {
    const page = Number(filter.page || 1);
    const limit = Number(filter.limit || 20);

    const where: any = {};

    // 🔍 Filter theo loại câu hỏi
    if (filter.type) {
        where.type = filter.type;
    }

    // 🔍 Filter theo môn học
    if (filter.subjectId) {
        where.subjectId = Number(filter.subjectId);
    }

    // 🔍 Filter theo chương
    if (filter.chapterId) {
        where.chapterId = Number(filter.chapterId);
    }

    // 🔍 Filter theo độ khó
    if (filter.difficulty) {
        where.difficulty = filter.difficulty;
    }

    // 🔍 Search theo nội dung (hỗ trợ cả search và q)
    const searchKeyword = filter.search || filter.q;
    if (searchKeyword) {
        where.content = {
            contains: searchKeyword,
            mode: "insensitive",
        };
    }

    // 🔍 Filter theo assignment
    if (filter.assignmentId) {
        where.assignments = {
            some: {
                assignmentId: Number(filter.assignmentId),
            },
        };
    }

    // Debug log
    console.log("🔍 Prisma where clause:", JSON.stringify(where, null, 2));

    try {
        const [items, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    choices: {
                        orderBy: { order: "asc" },
                    },
                    testCases: {
                        orderBy: { order: "asc" },
                    },
                    subject: {
                        select: {
                            id: true,
                            subjectCode: true,
                            subjectName: true,
                        },
                    },
                    chapter: {
                        select: {
                            id: true,
                            chapterCode: true,
                            chapterName: true,
                        },
                    },
                    _count: {
                        select: {
                            assignments: true,
                        },
                    },
                },
            }),
            prisma.question.count({ where }),
        ]);

        console.log(`✅ Found ${items.length} questions out of ${total} total`);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("❌ Error in getAllQuestions:", error);
        throw error;
    }
}

