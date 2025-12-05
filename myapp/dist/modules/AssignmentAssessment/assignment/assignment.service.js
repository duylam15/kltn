"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitCodeAnswer = submitCodeAnswer;
exports.submitProjectAnswer = submitProjectAnswer;
exports.getAnswerStatus = getAnswerStatus;
exports.getAssignmentsBySection = getAssignmentsBySection;
exports.getAssignmentsBySectionForStudent = getAssignmentsBySectionForStudent;
exports.createAssignment = createAssignment;
exports.updateAssignment = updateAssignment;
exports.deleteAssignment = deleteAssignment;
exports.getAllAssignments = getAllAssignments;
exports.getAssignmentById = getAssignmentById;
exports.getSubmissionsByAssignment = getSubmissionsByAssignment;
exports.startAssignment = startAssignment;
exports.submitAssignment = submitAssignment;
exports.getAssignmentWithBestSubmissions = getAssignmentWithBestSubmissions;
exports.getSubmissionsByStudentAndAssignment = getSubmissionsByStudentAndAssignment;
exports.getPublicAssignments = getPublicAssignments;
const queue_1 = require("../../../middlewares/queue");
const client_1 = require("../../../prisma/client");
const uuid_1 = require("uuid");
// Lưu 1 câu trả lời code và đẩy vào queue judge
async function submitCodeAnswer(data) {
    // Tìm submission cuối cùng của học sinh cho assignment này
    const lastSubmission = await client_1.prisma.submission.findFirst({
        where: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
        },
        orderBy: { attempt: "desc" },
    });
    const attempt = lastSubmission ? lastSubmission.attempt + 1 : 1;
    // 👇 Luôn tạo mới submission
    const submission = await client_1.prisma.submission.create({
        data: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            startedAt: new Date(),
            attempt,
        },
    });
    // 👇 Luôn tạo mới answer
    const answer = await client_1.prisma.submissionAnswer.create({
        data: {
            submissionId: submission.id,
            questionId: data.questionId,
            codeAnswer: data.codeAnswer,
            language: data.language,
            judgeStatus: "queued",
        },
    });
    // Đẩy job sang worker
    await queue_1.queue.add("judge", { answerId: answer.id });
    return { submission, answer };
}
// Folder (project) submission
async function submitProjectAnswer(data) {
    const lastSubmission = await client_1.prisma.submission.findFirst({
        where: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
        },
        orderBy: { attempt: "desc" },
    });
    const attempt = lastSubmission ? lastSubmission.attempt + 1 : 1;
    const submission = await client_1.prisma.submission.create({
        data: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            startedAt: new Date(),
            attempt,
        },
    });
    const answer = await client_1.prisma.submissionAnswer.create({
        data: {
            submissionId: submission.id,
            questionId: data.questionId,
            filePath: data.filePath,
            isFolder: true,
            judgeStatus: "queued",
        },
    });
    await queue_1.queue.add("judge", { answerId: answer.id });
    return { submission, answer };
}
async function getAnswerStatus(answerId) {
    return client_1.prisma.submissionAnswer.findUnique({
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
async function getAssignmentsBySection(sectionId) {
    return client_1.prisma.assignment.findMany({
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
async function getAssignmentsBySectionForStudent(sectionId, studentId, filters) {
    const now = new Date();
    // Build where clause
    const whereClause = {
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
    const assignments = (await client_1.prisma.assignment.findMany({
        where: whereClause,
        include: {
            sectionLinks: {
                where: { sectionId },
                include: {
                    section: {
                        select: { id: true },
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
                    question: { order: "asc" },
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
    }));
    // Map và thêm thông tin status
    const result = assignments.map((assignment) => {
        const submission = assignment.submissions[0]; // Lấy submission của sinh viên
        // Xác định status
        let status = "not_started";
        if (submission) {
            if (submission.completedAt) {
                status = "completed";
            }
            else if (submission.startedAt) {
                status = "in_progress";
            }
        }
        // Check overdue
        const isOverdue = assignment.dueDate &&
            new Date(assignment.dueDate) < now &&
            status !== "completed";
        if (isOverdue) {
            status = "overdue";
        }
        // Calculate total points
        const totalPoints = assignment.questions.reduce((sum, aq) => sum + (aq.question.points ?? 0), 0);
        // Calculate progress
        let progress = 0;
        if (submission?.answers) {
            progress = Math.round((submission.answers.length / assignment.questions.length) * 100);
        }
        return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            type: assignment.type,
            dueDate: assignment.dueDate,
            maxScore: totalPoints,
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
                    maxScore: totalPoints,
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
            canSubmit: status !== "completed" &&
                (assignment.allowLateSubmission || !isOverdue),
        };
    });
    // Filter by status nếu cần
    if (filters.status && filters.status !== "all") {
        return result.filter((a) => a.status === filters.status);
    }
    return result;
}
async function createAssignment(data) {
    console.log("📥 Data received in createAssignment:");
    console.log("allowLateSubmission:", data.allowLateSubmission);
    console.log("Type of allowLateSubmission:", typeof data.allowLateSubmission);
    console.log("Will save as:", data);
    // 🔥 THÊM: Validate subject nếu có
    if (data.subjectId !== undefined && data.subjectId !== null) {
        const subject = await client_1.prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new Error(`Subject với id ${data.subjectId} không tồn tại`);
        }
    }
    // 🔥 THÊM: Validate chapter nếu có
    if (data.chapterId !== undefined && data.chapterId !== null) {
        const chapter = await client_1.prisma.chapter.findUnique({
            where: { id: data.chapterId },
            include: { subject: true },
        });
        if (!chapter) {
            throw new Error(`Chapter với id ${data.chapterId} không tồn tại`);
        }
        // Kiểm tra chapter có thuộc subject không
        if (data.subjectId && chapter.subjectId !== data.subjectId) {
            throw new Error(`Chapter ${data.chapterId} không thuộc về Subject ${data.subjectId}`);
        }
    }
    return client_1.prisma.assignment.create({
        data: {
            title: data.title,
            description: data.description,
            type: data.type,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            maxScore: data.maxScore ?? 10,
            passingScore: data.passingScore ?? null,
            timeLimit: data.timeLimit ?? null,
            maxAttempts: data.maxAttempts ?? 1,
            // 🔥 SỬA: Xử lý đúng cho boolean
            shuffleQuestions: data.shuffleQuestions === true, // chỉ true nếu explicitly true
            showAnswersAfterSubmit: data.showAnswersAfterSubmit === true,
            allowLateSubmission: data.allowLateSubmission === true, // 🔥 ĐÂY
            isPublic: data.isPublic === true,
            difficulty: data.difficulty,
            createdBy: data.createdBy,
            subjectId: data.subjectId ?? null,
            chapterId: data.chapterId ?? null,
            originalAssignmentId: data.originalAssignmentId ?? (0, uuid_1.v4)(),
        },
        include: {
            // 🔥 THÊM include để trả về đầy đủ thông tin
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
        },
    });
}
async function updateAssignment(id, data) {
    // 🔥 THÊM: Validate subject nếu có
    if (data.subjectId !== undefined && data.subjectId !== null) {
        const subject = await client_1.prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new Error(`Subject với id ${data.subjectId} không tồn tại`);
        }
    }
    // 🔥 THÊM: Validate chapter nếu có
    if (data.chapterId !== undefined && data.chapterId !== null) {
        const chapter = await client_1.prisma.chapter.findUnique({
            where: { id: data.chapterId },
            include: { subject: true },
        });
        if (!chapter) {
            throw new Error(`Chapter với id ${data.chapterId} không tồn tại`);
        }
        // Nếu đang set cả subjectId và chapterId, check tương thích
        if (data.subjectId && chapter.subjectId !== data.subjectId) {
            throw new Error(`Chapter ${data.chapterId} không thuộc về Subject ${data.subjectId}`);
        }
        // Nếu chỉ set chapterId mà không set subjectId, check với subject hiện tại
        if (data.subjectId === undefined) {
            const currentAssignment = await client_1.prisma.assignment.findUnique({
                where: { id },
                select: { subjectId: true },
            });
            if (currentAssignment?.subjectId &&
                chapter.subjectId !== currentAssignment.subjectId) {
                throw new Error(`Chapter ${data.chapterId} không thuộc về Subject hiện tại`);
            }
        }
    }
    // 🔥 THÊM: Chuẩn bị updateData
    const updateData = {};
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.maxScore !== undefined)
        updateData.maxScore = data.maxScore;
    if (data.passingScore !== undefined)
        updateData.passingScore = data.passingScore;
    if (data.timeLimit !== undefined)
        updateData.timeLimit = data.timeLimit;
    if (data.maxAttempts !== undefined)
        updateData.maxAttempts = data.maxAttempts;
    if (data.shuffleQuestions !== undefined)
        updateData.shuffleQuestions = data.shuffleQuestions;
    if (data.showAnswersAfterSubmit !== undefined)
        updateData.showAnswersAfterSubmit = data.showAnswersAfterSubmit;
    if (data.allowLateSubmission !== undefined)
        updateData.allowLateSubmission = data.allowLateSubmission;
    if (data.difficulty !== undefined)
        updateData.difficulty = data.difficulty;
    // 🔥 THÊM: Xử lý subjectId và chapterId
    if (data.subjectId !== undefined) {
        updateData.subjectId = data.subjectId;
    }
    if (data.chapterId !== undefined) {
        updateData.chapterId = data.chapterId;
    }
    return client_1.prisma.assignment.update({
        where: { id },
        data: updateData,
    });
}
async function deleteAssignment(id) {
    return client_1.prisma.assignment.delete({
        where: { id },
    });
}
async function getAllAssignments(filter) {
    return client_1.prisma.assignment.findMany({
        where: {
            ...(filter.sectionId
                ? {
                    sectionLinks: {
                        some: { sectionId: Number(filter.sectionId) },
                    },
                }
                : {}),
            ...(filter.type ? { type: filter.type } : {}),
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
async function getAssignmentById(id) {
    return client_1.prisma.assignment.findUnique({
        where: { id },
        include: { questions: true },
    });
}
async function getSubmissionsByAssignment(id) {
    return client_1.prisma.submission.findMany({
        where: { assignmentId: id },
        include: { student: true },
    });
}
async function startAssignment(studentId, assignmentId) {
    try {
        // Kiểm tra assignment có tồn tại không
        const assignment = await client_1.prisma.assignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new Error("Không tìm thấy bài tập");
        }
        // Kiểm tra student có tồn tại không
        const student = await client_1.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new Error("Không tìm thấy sinh viên");
        }
        // Kiểm tra đã có submission chưa
        const existingSubmission = await client_1.prisma.submission.findFirst({
            where: {
                assignmentId,
                studentId,
            },
            orderBy: { attempt: "desc" }, // lấy lần nộp mới nhất
        });
        if (existingSubmission) {
            // Nếu đã có, trả về submission hiện tại
            return existingSubmission;
        }
        // Tạo submission mới
        return await client_1.prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                startedAt: new Date(),
            },
        });
    }
    catch (error) {
        console.error("Error in startAssignment:", error);
        throw error;
    }
}
async function calculateAnswerScore(answer) {
    const question = await client_1.prisma.question.findUnique({
        where: { id: answer.questionId },
        include: { choices: true },
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
        const selected = answer.selectedChoices;
        const correctCount = correctChoices.length;
        const correctSelected = selected.filter((id) => correctChoices.includes(id)).length;
        const wrongSelected = selected.length - correctSelected;
        // ✅ partial credit
        score =
            (Math.max(0, correctSelected - wrongSelected) / correctCount) *
                maxScore;
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
async function submitAssignment(studentId, assignmentId, answers) {
    try {
        // 1.  Xác định attempt mới
        const lastSubmission = await client_1.prisma.submission.findFirst({
            where: { assignmentId, studentId },
            orderBy: { attempt: "desc" },
        });
        const attempt = lastSubmission ? lastSubmission.attempt + 1 : 1;
        // 2. Tạo submission mới
        const submission = await client_1.prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                startedAt: new Date(),
                completedAt: new Date(),
                submittedAt: new Date(),
                attempt,
            },
        });
        let totalScore = 0;
        let totalMaxScore = 0;
        let allAutoGraded = true;
        const answerResults = [];
        // 3. Lưu từng câu trả lời
        for (const ans of answers) {
            // 🔥 LẤY THÔNG TIN QUESTION ĐỂ XÁC ĐỊNH TYPE
            const question = await client_1.prisma.question.findUnique({
                where: { id: ans.questionId },
                include: { choices: true },
            });
            if (!question) {
                console.error(`Question ${ans.questionId} not found`);
                continue;
            }
            const scoreResult = await calculateAnswerScore(ans);
            // 🔥 CHUẨN BỊ DATA TÙY THEO TYPE
            const answerData = {
                submissionId: submission.id,
                questionId: ans.questionId,
                score: scoreResult.score,
                maxScore: scoreResult.maxScore,
            };
            // 🔥 CODING QUESTION
            if (question.type === "coding") {
                answerData.codeAnswer = ans.codeAnswer || null;
                answerData.language = ans.language
                    ? ans.language
                    : null;
                answerData.judgeStatus = "queued";
                allAutoGraded = false;
            }
            // 🔥 ESSAY QUESTION
            else if (question.type === "essay") {
                answerData.essayAnswer = ans.essayAnswer || null;
                answerData.judgeStatus = "pending_review"; // Chờ giáo viên chấm
                allAutoGraded = false;
            }
            // 🔥 MULTIPLE CHOICE / TRUE FALSE
            else {
                answerData.selectedChoices = ans.selectedChoices
                    ? { set: ans.selectedChoices }
                    : { set: [] };
                answerData.judgeStatus = "graded";
            }
            const savedAnswer = await client_1.prisma.submissionAnswer.create({
                data: answerData,
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
            // 🔥 ĐẨY CODE VÀO QUEUE JUDGE
            if (question.type === "coding" && ans.codeAnswer && ans.language) {
                await queue_1.queue.add("judge", { answerId: savedAnswer.id });
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
                codeAnswer: savedAnswer.codeAnswer, // 🔥 THÊM VÀO RESPONSE
                language: savedAnswer.language, // 🔥 THÊM VÀO RESPONSE
                correctChoices: savedAnswer.question.choices
                    .filter((c) => c.isCorrect)
                    .map((c) => c.id),
                needsManualGrading: savedAnswer.question.type === "essay",
                isBeingJudged: savedAnswer.question.type === "coding" &&
                    savedAnswer.judgeStatus === "queued",
                judgeStatus: savedAnswer.judgeStatus,
            });
        }
        // 4. Cập nhật điểm tổng cho submission
        const updatedSubmission = await client_1.prisma.submission.update({
            where: { id: submission.id },
            data: {
                score: totalScore,
                maxScore: totalMaxScore,
                autoGraded: allAutoGraded,
                gradedAt: allAutoGraded ? new Date() : null,
            },
            include: {
                answers: {
                    include: { question: true },
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
        const isPassing = updatedSubmission.assignment.passingScore
            ? totalScore >= updatedSubmission.assignment.passingScore
            : true;
        // 5.  Trả kết quả
        return {
            submission: {
                id: updatedSubmission.id,
                assignmentId: updatedSubmission.assignmentId,
                assignmentTitle: updatedSubmission.assignment.title,
                studentId: updatedSubmission.studentId,
                attempt,
                startedAt: updatedSubmission.startedAt,
                completedAt: updatedSubmission.completedAt,
                submittedAt: updatedSubmission.submittedAt,
                score: totalScore,
                maxScore: totalMaxScore,
                percentage: totalMaxScore > 0
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
                correctQuestions: answerResults.filter((a) => a.isCorrect)
                    .length,
                wrongQuestions: answerResults.filter((a) => !a.isCorrect &&
                    !a.needsManualGrading &&
                    !a.isBeingJudged).length,
                needsManualGrading: answerResults.filter((a) => a.needsManualGrading).length,
                beingJudged: answerResults.filter((a) => a.isBeingJudged)
                    .length,
                totalScore,
                totalMaxScore,
                percentage: totalMaxScore > 0
                    ? Math.round((totalScore / totalMaxScore) * 100)
                    : 0,
                isPassing,
            },
            showAnswers: updatedSubmission.assignment.showAnswersAfterSubmit,
        };
    }
    catch (error) {
        console.error("Error in submitAssignment:", error);
        throw error;
    }
}
async function getAssignmentWithBestSubmissions(assignmentId, sectionId) {
    // 1. Lấy assignment
    const assignment = await client_1.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            questions: true,
            sectionLinks: sectionId ? { where: { sectionId } } : true,
        },
    });
    if (!assignment) {
        throw new Error("Không tìm thấy bài tập");
    }
    // 2. Lấy tất cả submissions
    const allSubmissions = await client_1.prisma.submission.findMany({
        where: { assignmentId },
        include: {
            student: {
                select: {
                    id: true,
                    studentCode: true,
                    className: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
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
    });
    // 3. Nhóm theo studentId và lấy điểm cao nhất
    const bestSubmissionsMap = new Map();
    allSubmissions.forEach((submission) => {
        const studentId = submission.studentId;
        const current = bestSubmissionsMap.get(studentId);
        if (!current) {
            bestSubmissionsMap.set(studentId, submission);
        }
        else {
            const currentScore = current.score ?? -1;
            const newScore = submission.score ?? -1;
            // Ưu tiên điểm cao hơn, nếu bằng nhau thì lấy mới hơn
            if (newScore > currentScore ||
                (newScore === currentScore &&
                    new Date(submission.submittedAt) >
                        new Date(current.submittedAt))) {
                bestSubmissionsMap.set(studentId, submission);
            }
        }
    });
    return {
        ...assignment,
        submissions: Array.from(bestSubmissionsMap.values()),
    };
}
async function getSubmissionsByStudentAndAssignment(studentId, assignmentId) {
    return client_1.prisma.submission.findMany({
        where: {
            studentId,
            assignmentId,
        },
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
        orderBy: {
            attempt: "asc", // từ lần đầu tiên đến mới nhất
        },
    });
}
async function getPublicAssignments() {
    return client_1.prisma.assignment.findMany({
        where: {
            isPublic: true,
        },
        include: {
            questions: {
                select: {
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
        },
        orderBy: [{ createdAt: "desc" }],
    });
}
