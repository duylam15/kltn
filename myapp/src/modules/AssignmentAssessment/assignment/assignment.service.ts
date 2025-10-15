import { prisma } from "@/prisma/client";
import { AssignmentType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function getAssignmentsBySection(sectionId: number) {
  return prisma.assignment.findMany({
    where: {
      sectionLinks: {
        some: { sectionId },
      },
    },
    include: {
      sectionLinks: {
        include: { section: true },
      },
      questions: true,
      submissions: true,
    },
  });
}

export async function createAssignment(data: {
    title: string;
    description?: string;
    type: AssignmentType;
    dueDate?: string | Date | null;
    maxScore?: number;
    passingScore?: number;
    timeLimit?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    showAnswersAfterSubmit?: boolean;
    allowLateSubmission?: boolean;
    createdBy: number;
    originalAssignmentId?: string | null;
}) {
    return prisma.assignment.create({
        data: {
            title: data.title,
            description: data.description,
            type: data.type,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            maxScore: data.maxScore ?? 100,
            passingScore: data.passingScore ?? null,
            timeLimit: data.timeLimit ?? null,
            maxAttempts: data.maxAttempts ?? 1,
            shuffleQuestions: data.shuffleQuestions ?? false,
            showAnswersAfterSubmit: data.showAnswersAfterSubmit ?? false,
            allowLateSubmission: data.allowLateSubmission ?? false,
            createdBy: data.createdBy,
            originalAssignmentId: data.originalAssignmentId ?? uuidv4(), // 👈 luôn đảm bảo có string
        },
    });
}

export async function getAssignmentsBySectionForStudent(
    sectionId: number,
    studentId: number,
    filters: {
        type?: AssignmentType;
        status?:
            | "all"
            | "not_started"
            | "in_progress"
            | "completed"
            | "overdue";
    }
) {
    const now = new Date();

    // Build where clause
    const whereClause: any = {
        sectionLinks: {
            some: {
                sectionId: sectionId,
                isOpen: true, // Chỉ lấy assignment đang mở
            },
        },
    };

    // Filter by type
    if (filters.type) {
        whereClause.type = filters.type;
    }

    // Lấy tất cả assignments của section
    const assignments = await prisma.assignment.findMany({
        where: whereClause,
        include: {
            sectionLinks: {
                where: { sectionId },
                include: {
                    section: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            points: true,
                            order: true,
                        },
                    },
                },
                orderBy: {
                    question: {
                        order: "asc",
                    },
                },
            },
            submissions: {
                where: { studentId },
                include: {
                    answers: {
                        select: {
                            id: true,
                            questionId: true,
                            score: true,
                            maxScore: true,
                            isCorrect: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }) as any[];

    // Map và thêm thông tin status
    const result = assignments.map((assignment) => {
        const submission = assignment.submissions[0]; // Lấy submission của sinh viên

        // Xác định status
        let status: "not_started" | "in_progress" | "completed" | "overdue" =
            "not_started";

        if (submission) {
            if (submission.completedAt) {
                status = "completed";
            } else if (submission.startedAt) {
                status = "in_progress";
            }
        }

        // Check overdue
        const isOverdue =
            assignment.dueDate &&
            new Date(assignment.dueDate) < now &&
            status !== "completed";

        if (isOverdue) {
            status = "overdue";
        }

        // Calculate total points
        const totalPoints = assignment.questions.reduce(
            (sum:any, aq:any) => sum + aq.question.points,
            0
        );

        // Calculate progress
        let progress = 0;
        if (submission?.answers) {
            progress = Math.round(
                (submission.answers.length / assignment.questions.length) * 100
            );
        }

        return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            type: assignment.type,
            dueDate: assignment.dueDate,
            maxScore: assignment.maxScore,
            passingScore: assignment.passingScore,
            timeLimit: assignment.timeLimit,
            maxAttempts: assignment.maxAttempts,
            shuffleQuestions: assignment.shuffleQuestions,
            showAnswersAfterSubmit: assignment.showAnswersAfterSubmit,
            allowLateSubmission: assignment.allowLateSubmission,
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt,
            section: assignment.sectionLinks[0]?.section || null,
            assignedAt: assignment.sectionLinks[0]?.assignedAt || null,
            isOpen: assignment.sectionLinks[0]?.isOpen || false,
            totalQuestions: assignment.questions.length,
            totalPoints: totalPoints,
            submission: submission
                ? {
                      id: submission.id,
                      startedAt: submission.startedAt,
                      completedAt: submission.completedAt,
                      submittedAt: submission.submittedAt,
                      score: submission.score,
                      maxScore: submission.maxScore,
                      autoGraded: submission.autoGraded,
                      feedback: submission.feedback,
                      gradedAt: submission.gradedAt,
                      answeredQuestions: submission.answers.length,
                      progress: progress,
                  }
                : null,
            status,
            isOverdue: isOverdue || false,
            isCompleted: status === "completed",
            canSubmit:
                status !== "completed" &&
                (assignment.allowLateSubmission || !isOverdue),
        };
    });

    // Filter by status nếu cần
    if (filters.status && filters.status !== "all") {
        return result.filter((a) => a.status === filters.status);
    }

    return result;
}

export async function updateAssignment(id: number, data: any) {
    return prisma.assignment.update({
        where: { id },
        data,
    });
}

export async function deleteAssignment(id: number) {
    return prisma.assignment.delete({ where: { id } });
}


export async function getAllAssignments(filter: any) {
    return prisma.assignment.findMany({
        where: {
            ...(filter.sectionId
                ? {
                      sectionLinks: {
                          some: { sectionId: Number(filter.sectionId) },
                      },
                  }
                : {}),
            ...(filter.type ? { type: filter.type as AssignmentType } : {}),
            ...(filter.dueBefore
                ? { dueDate: { lte: new Date(filter.dueBefore) } }
                : {}),
        },
        include: {
            sectionLinks: {
                include: { section: true }, // lấy thông tin section liên kết
            },
            questions: true, // lấy chi tiết câu hỏi
            submissions: true,
        },
    });
}


export async function getAssignmentById(id: number) {
    return prisma.assignment.findUnique({
        where: { id },
        include: { questions: true },
    });
}

export async function getSubmissionsByAssignment(id: number) {
    return prisma.submission.findMany({
        where: { assignmentId: id },
        include: { student: true },
    });
}

export async function startAssignment(studentId: number, assignmentId: number) {
    try {
        // Kiểm tra assignment có tồn tại không
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
        });

        if (!assignment) {
            throw new Error("Không tìm thấy bài tập");
        }

        // Kiểm tra student có tồn tại không
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            throw new Error("Không tìm thấy sinh viên");
        }

        // Kiểm tra đã có submission chưa
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId,
                },
            },
        });

        if (existingSubmission) {
            // Nếu đã có, trả về submission hiện tại
            return existingSubmission;
        }

        // Tạo submission mới
        return await prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                startedAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error("Error in startAssignment:", error);
        throw error;
    }
}

export async function submitAssignment(
    studentId: number,
    assignmentId: number,
    answers: any[]
) {
    try {
        // Tìm hoặc tạo submission
        const submission = await prisma.submission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId,
                },
            },
            update: {
                completedAt: new Date(),
                submittedAt: new Date(),
            },
            create: {
                assignmentId,
                studentId,
                startedAt: new Date(),
                completedAt: new Date(),
                submittedAt: new Date(),
            },
        });

        // Lưu từng câu trả lời
        for (const ans of answers) {
            await prisma.submissionAnswer.upsert({
                where: {
                    submissionId_questionId: {
                        submissionId: submission.id,
                        questionId: ans.questionId,
                    },
                },
                update: {
                    selectedChoices: ans.selectedChoices || null,
                    essayAnswer: ans.essayAnswer || null,
                    codeAnswer: ans.codeAnswer || null,
                    language: ans.language || null,
                },
                create: {
                    submissionId: submission.id,
                    questionId: ans.questionId,
                    selectedChoices: ans.selectedChoices || null,
                    essayAnswer: ans.essayAnswer || null,
                    codeAnswer: ans.codeAnswer || null,
                    language: ans.language || null,
                },
            });
        }

        // Trả về submission với answers
        return await prisma.submission.findUnique({
            where: { id: submission.id },
            include: { answers: true },
        });
    } catch (error: any) {
        console.error("Error in submitAssignment:", error);
        throw error;
    }
}
