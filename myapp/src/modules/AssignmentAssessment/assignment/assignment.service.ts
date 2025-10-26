import { queue } from "@/middlewares/queue";
import { prisma } from "@/prisma/client";
import { AssignmentType, ProgrammingLanguage } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// Lưu 1 câu trả lời code và đẩy vào queue judge
export async function submitCodeAnswer(data: {
    studentId: number;
    assignmentId: number;
    questionId: number;
    codeAnswer: string;
    language: string;
}) {
    const submission = await prisma.submission.upsert({
        where: {
            assignmentId_studentId: {
                assignmentId: data.assignmentId,
                studentId: data.studentId,
            },
        },
        update: {},
        create: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            startedAt: new Date(),
        },
    });

    const answer = await prisma.submissionAnswer.upsert({
        where: {
            submissionId_questionId: {
                submissionId: submission.id,
                questionId: data.questionId,
            },
        },
        update: {
            codeAnswer: data.codeAnswer,
            language: data.language as any,
            judgeStatus: "queued",
        },
        create: {
            codeAnswer: data.codeAnswer,
            language: data.language as any,
            judgeStatus: "queued",
            submission: { connect: { id: submission.id } },
            question: { connect: { id: data.questionId } },
        },
    });

    // Đẩy job sang worker
    await queue.add("judge", { answerId: answer.id });

    return answer;
}

// Folder (project) submission
export async function submitProjectAnswer(data: {
    studentId: number;
    assignmentId: number;
    questionId: number;
    filePath: string;
}) {
    const submission = await prisma.submission.upsert({
        where: {
            assignmentId_studentId: {
                assignmentId: data.assignmentId,
                studentId: data.studentId,
            },
        },
        update: {},
        create: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            startedAt: new Date(),
        },
    });

    const answer = await prisma.submissionAnswer.create({
        data: {
            submissionId: submission.id,
            questionId: data.questionId,
            filePath: data.filePath,
            isFolder: true,
            judgeStatus: "queued",
        },
    });

    await queue.add("judge", { answerId: answer.id });

    return answer;
}

export async function getAnswerStatus(answerId: number) {
    return prisma.submissionAnswer.findUnique({
        where: { id: answerId },
        select: {
            id: true,
            judgeStatus: true,
            score: true,
            maxScore: true,
            stdoutLog: true,
            stderrLog: true,
            testResults: true,
        },
    });
}

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
    const assignments = (await prisma.assignment.findMany({
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
                            judgeStatus: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    })) as any[];

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
            (sum: any, aq: any) => sum + aq.question.points,
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

async function calculateAnswerScore(answer: {
    questionId: number;
    selectedChoices?: number[];
    essayAnswer?: string;
    codeAnswer?: string;
}) {
    const question = await prisma.question.findUnique({
        where: { id: answer.questionId },
        include: {
            choices: true,
        },
    });

    if (!question) {
        return { score: 0, maxScore: 0 };
    }

    const maxScore = question.points;
    let score = 0;

    // Multiple choice questions
    if (question.type === "multiple_choice" && answer.selectedChoices) {
        const correctChoices = question.choices
            .filter((c) => c.isCorrect)
            .map((c) => c.id);

        const selectedChoices = answer.selectedChoices || [];

        // Kiểm tra số lượng đáp án đúng
        const correctCount = correctChoices.length;

        // Số đáp án đúng được chọn
        const correctSelected = selectedChoices.filter((id) =>
            correctChoices.includes(id)
        ).length;

        // Số đáp án sai được chọn
        const wrongSelected = selectedChoices.length - correctSelected;

        // Tính điểm: chỉ đúng hoàn toàn mới được điểm
        if (
            correctSelected === correctCount &&
            wrongSelected === 0 &&
            selectedChoices.length === correctCount
        ) {
            score = maxScore;
        } else {
            score = 0;
        }
    }

    // Essay questions - không tự động chấm
    if (question.type === "essay") {
        score = 0; // Cần giáo viên chấm thủ công
    }

    // Code questions - sẽ được judge riêng
    if (question.type === "coding") {
        score = 0; // Sẽ được cập nhật sau khi judge
    }

    return {
        score,
        maxScore,
        isAutoGraded: question.type === "multiple_choice" || question.type === "coding",
    };
}

// Cập nhật hàm submitAssignment
export async function submitAssignment(
    studentId: number,
    assignmentId: number,
    answers: any[]
) {
    try {
        // 1. Tìm hoặc tạo submission
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

        let totalScore = 0;
        let totalMaxScore = 0;
        let allAutoGraded = true;
        const answerResults = [];

        // 2. Lưu từng câu trả lời và tính điểm
        for (const ans of answers) {
            // Tính điểm cho câu trả lời
            const scoreResult = await calculateAnswerScore(ans);

            // Lưu câu trả lời
            const savedAnswer = await prisma.submissionAnswer.upsert({
                where: {
                    submissionId_questionId: {
                        submissionId: submission.id,
                        questionId: ans.questionId,
                    },
                },
                update: {
                    codeAnswer: ans.codeAnswer || null,
                    language: ans.language
                        ? (ans.language as ProgrammingLanguage)
                        : null,
                    selectedChoices: ans.selectedChoices
                        ? { set: ans.selectedChoices }
                        : { set: [] },
                    score: scoreResult.score,
                    maxScore: scoreResult.maxScore,
                    judgeStatus:
                        ans.codeAnswer && ans.language ? "queued" : "running",
                },
                create: {
                    codeAnswer: ans.codeAnswer || null,
                    language: ans.language
                        ? (ans.language as ProgrammingLanguage)
                        : null,
                    selectedChoices: ans.selectedChoices
                        ? { set: ans.selectedChoices }
                        : { set: [] },
                    score: scoreResult.score,
                    maxScore: scoreResult.maxScore,
                    judgeStatus:
                        ans.codeAnswer && ans.language ? "queued" : "running",
                    submission: { connect: { id: submission.id } },
                    question: { connect: { id: ans.questionId } },
                },
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            points: true,
                            choices: {
                                select: {
                                    id: true,
                                    content: true,
                                    isCorrect: true,
                                },
                            },
                        },
                    },
                },
            });

            // Đẩy code questions vào queue để judge
            if (ans.codeAnswer && ans.language) {
                await queue.add("judge", { answerId: savedAnswer.id });
                allAutoGraded = false;
            }

            // Nếu là essay, cần chấm thủ công
            if (savedAnswer.question.type === "essay") {
                allAutoGraded = false;
            }

            totalScore += scoreResult.score;
            totalMaxScore += scoreResult.maxScore;

            answerResults.push({
                answerId: savedAnswer.id,
                questionId: savedAnswer.questionId,
                questionType: savedAnswer.question.type,
                questionContent: savedAnswer.question.content,
                score: scoreResult.score,
                maxScore: scoreResult.maxScore,
                isCorrect: scoreResult.score === scoreResult.maxScore,
                selectedChoices: savedAnswer.selectedChoices,
                correctChoices: savedAnswer.question.choices
                    .filter((c) => c.isCorrect)
                    .map((c) => c.id),
                needsManualGrading: savedAnswer.question.type === "essay",
                isBeingJudged:
                    savedAnswer.question.type === "coding" &&
                    savedAnswer.judgeStatus === "queued",
                judgeStatus: savedAnswer.judgeStatus,
            });
        }

        // 3. Cập nhật tổng điểm cho submission
        const updatedSubmission = await prisma.submission.update({
            where: { id: submission.id },
            data: {
                score: totalScore,
                maxScore: totalMaxScore,
                autoGraded: allAutoGraded,
                gradedAt: allAutoGraded ? new Date() : null,
            },
            include: {
                answers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                points: true,
                            },
                        },
                    },
                },
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        maxScore: true,
                        passingScore: true,
                        showAnswersAfterSubmit: true,
                    },
                },
            },
        });

        // 4. Kiểm tra đạt/không đạt
        const isPassing = updatedSubmission.assignment.passingScore
            ? totalScore >= updatedSubmission.assignment.passingScore
            : true;

        // 5. Trả về kết quả chi tiết
        return {
            submission: {
                id: updatedSubmission.id,
                assignmentId: updatedSubmission.assignmentId,
                assignmentTitle: updatedSubmission.assignment.title,
                studentId: updatedSubmission.studentId,
                startedAt: updatedSubmission.startedAt,
                completedAt: updatedSubmission.completedAt,
                submittedAt: updatedSubmission.submittedAt,
                score: totalScore,
                maxScore: totalMaxScore,
                percentage:
                    totalMaxScore > 0
                        ? Math.round((totalScore / totalMaxScore) * 100)
                        : 0,
                isPassing,
                autoGraded: allAutoGraded,
                gradedAt: updatedSubmission.gradedAt,
                needsManualGrading: !allAutoGraded,
            },
            answers: answerResults,
            summary: {
                totalQuestions: answers.length,
                answeredQuestions: answers.length,
                correctQuestions: answerResults.filter((a) => a.isCorrect).length,
                wrongQuestions: answerResults.filter(
                    (a) =>
                        !a.isCorrect &&
                        !a.needsManualGrading &&
                        !a.isBeingJudged
                ).length,
                needsManualGrading: answerResults.filter(
                    (a) => a.needsManualGrading
                ).length,
                beingJudged: answerResults.filter((a) => a.isBeingJudged).length,
                totalScore,
                totalMaxScore,
                percentage:
                    totalMaxScore > 0
                        ? Math.round((totalScore / totalMaxScore) * 100)
                        : 0,
                isPassing,
            },
            // Chỉ hiển thị đáp án nếu được phép
            showAnswers: updatedSubmission.assignment.showAnswersAfterSubmit,
        };
    } catch (error: any) {
        console.error("Error in submitAssignment:", error);
        throw error;
    }
}