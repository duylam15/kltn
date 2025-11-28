import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";

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
            createdBy: data.createdBy,

            // 🆕 isPublic support
            isPublic: data.isPublic ?? false,

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


export async function getMineAndPublicQuestions(userId: number, filter: any) {
    const page = Number(filter.page || 1);
    const limit = Number(filter.limit || 20);

    // Build where clause: question created by user OR isPublic = true
    const where: any = {
        OR: [{ createdBy: userId }, { isPublic: true }],
    };

    // Apply additional filters if present
    if (filter.type) {
        where.type = filter.type;
    }
    if (filter.subjectId) {
        where.subjectId = Number(filter.subjectId);
    }
    if (filter.chapterId) {
        where.chapterId = Number(filter.chapterId);
    }
    if (filter.difficulty) {
        where.difficulty = filter.difficulty;
    }

    const searchKeyword = filter.search || filter.q;
    if (searchKeyword) {
        // If other filters already set keys like type/subjectId on where root, keep them. For search we need content filter.
        where.content = {
            contains: searchKeyword,
            mode: "insensitive",
        };
    }

    console.log(
        "🔍 getMineAndPublicQuestions where:",
        JSON.stringify(where, null, 2)
    );

    try {
        const [items, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    choices: { orderBy: { order: "asc" } },
                    testCases: { orderBy: { order: "asc" } },
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
                    createdByUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: { assignments: true },
                    },
                },
            }),
            prisma.question.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("❌ Error in getMineAndPublicQuestions:", error);
        throw error;
    }
}

export async function getPublicQuestions(filter: any) {
    const page = Number(filter.page || 1);
    const limit = Number(filter.limit || 20);

    const where: any = {
        isPublic: true,
    };

    // Filter theo loại câu hỏi
    if (filter.type) {
        where.type = filter.type;
    }

    // Filter theo môn học / chương
    if (filter.subjectId) {
        where.subjectId = Number(filter.subjectId);
    }
    if (filter.chapterId) {
        where.chapterId = Number(filter.chapterId);
    }

    // Filter theo độ khó
    if (filter.difficulty) {
        where.difficulty = filter.difficulty;
    }

    // Filter theo language
    if (filter.language) {
        where.language = filter.language;
    }

    // Search nội dung
    const searchKeyword = filter.search || filter.q;
    if (searchKeyword) {
        where.content = {
            contains: searchKeyword,
            mode: "insensitive",
        };
    }

    // Optionally filter by createdBy if provided (ví dụ: chỉ muốn câu hỏi public của 1 GV)
    if (filter.createdBy) {
        where.createdBy = Number(filter.createdBy);
    }

    console.log("🔍 getPublicQuestions where:", JSON.stringify(where, null, 2));

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
                    createdByUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
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

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("❌ Error in getPublicQuestions:", error);
        throw error;
    }
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

            // 🆕 isPublic toggling
            isPublic: data.isPublic,

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

// 🆕 Service: Lấy câu hỏi của user theo userId
export async function getQuestionsByUserId(userId: number, filter: any) {
    const page = Number(filter.page || 1);
    const limit = Number(filter.limit || 20);

    // Kiểm tra user có tồn tại không
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            teacher: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Build where clause
    const where: any = {
        // ✅ Chỉ lấy câu hỏi do user này tạo
        createdBy: userId,
    };

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

    // 🔍 Search theo nội dung
    const searchKeyword = filter.search || filter.q;
    if (searchKeyword) {
        where.content = {
            contains: searchKeyword,
            mode: "insensitive",
        };
    }

    console.log(
        "🔍 Questions by UserId where clause:",
        JSON.stringify(where, null, 2)
    );

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
                    createdByUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                            role: {
                                select: {
                                    id: true,
                                },
                            },
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

        console.log(
            `✅ Found ${items.length} questions of userId ${userId} out of ${total} total`
        );

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("❌ Error in getQuestionsByUserId:", error);
        throw error;
    }
}

// 🆕 Service: Lấy môn học có câu hỏi của user
export async function getUserSubjects(userId: number) {
    // Kiểm tra user
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            teacher: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Lấy các môn học có câu hỏi do user này tạo
    const subjects = await prisma.subject.findMany({
        where: {
            questions: {
                some: {
                    createdBy: userId,
                },
            },
        },
        select: {
            id: true,
            subjectCode: true,
            subjectName: true,
            _count: {
                select: {
                    questions: {
                        where: {
                            createdBy: userId,
                        },
                    },
                    chapters: true,
                },
            },
        },
        orderBy: {
            subjectCode: "asc",
        },
    });

    return subjects;
}

// 🆕 Service: Lấy chương theo môn học (có câu hỏi của user)
export async function getUserChaptersBySubject(
    userId: number,
    subjectId: number
) {
    // Kiểm tra user
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            teacher: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Kiểm tra môn học tồn tại
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
    });

    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    // Lấy các chương có câu hỏi do user này tạo
    const chapters = await prisma.chapter.findMany({
        where: {
            subjectId: subjectId,
            questions: {
                some: {
                    createdBy: userId,
                },
            },
        },
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: {
                    questions: {
                        where: {
                            createdBy: userId,
                        },
                    },
                },
            },
        },
    });

    return chapters;
}
