import { prisma } from "../../../prisma/client";

export async function getSubmissionsHistory(
    assignmentId: number,
    studentId: number
) {
    return prisma.submission.findMany({
        where: { assignmentId, studentId },
        orderBy: { submittedAt: "desc" },
        include: {
            answers: {
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            order: true,
                            points: true,
                        },
                    },
                },
            },
        },
    });
}

export async function getSubmissionById(id: number) {
    return prisma.submission.findUnique({
        where: { id },
        include: {
            answers: {
                include: {
                    question: true,
                },
            },
            assignment: true,
        },
    });
}

export async function setFinalSubmission(submissionId: number) {
    // Lấy bản ghi submission
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!submission) throw new Error("Submission không tồn tại");

    const { assignmentId, studentId } = submission;

    // Bỏ chọn các submission khác
    await prisma.submission.updateMany({
        where: {
            assignmentId,
            studentId,
            NOT: { id: submissionId },
        },
        data: { isFinal: false },
    });

    // Chọn submission này làm final
    return prisma.submission.update({
        where: { id: submissionId },
        data: { isFinal: true },
    });
}

// 🔥 HÀM CẬP NHẬT ĐIỂM SUBMISSION
export async function updateSubmissionScore(
    submissionId: number,
    data: {
        score?: number;
        feedback?: string;
    }
) {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!submission) {
        throw new Error("Submission không tồn tại");
    }

    // Cập nhật submission
    const updated = await prisma.submission.update({
        where: { id: submissionId },
        data: {
            score: data.score !== undefined ? data.score : submission.score,
            feedback:
                data.feedback !== undefined
                    ? data.feedback
                    : submission.feedback,
            gradedAt: new Date(), // 🔥 Cập nhật thời gian chấm
        },
        include: {
            answers: {
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            order: true,
                            points: true,
                        },
                    },
                },
            },
        },
    });

    return updated;
}
