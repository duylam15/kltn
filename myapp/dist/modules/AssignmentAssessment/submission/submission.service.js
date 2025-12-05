"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissionsHistory = getSubmissionsHistory;
exports.getSubmissionById = getSubmissionById;
exports.setFinalSubmission = setFinalSubmission;
exports.updateSubmissionScore = updateSubmissionScore;
const client_1 = require("../../../prisma/client");
async function getSubmissionsHistory(assignmentId, studentId) {
    return client_1.prisma.submission.findMany({
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
async function getSubmissionById(id) {
    return client_1.prisma.submission.findUnique({
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
async function setFinalSubmission(submissionId) {
    // Lấy bản ghi submission
    const submission = await client_1.prisma.submission.findUnique({
        where: { id: submissionId },
    });
    if (!submission)
        throw new Error("Submission không tồn tại");
    const { assignmentId, studentId } = submission;
    // Bỏ chọn các submission khác
    await client_1.prisma.submission.updateMany({
        where: {
            assignmentId,
            studentId,
            NOT: { id: submissionId },
        },
        data: { isFinal: false },
    });
    // Chọn submission này làm final
    return client_1.prisma.submission.update({
        where: { id: submissionId },
        data: { isFinal: true },
    });
}
// 🔥 HÀM CẬP NHẬT ĐIỂM SUBMISSION
async function updateSubmissionScore(submissionId, data) {
    const submission = await client_1.prisma.submission.findUnique({
        where: { id: submissionId },
    });
    if (!submission) {
        throw new Error("Submission không tồn tại");
    }
    // Cập nhật submission
    const updated = await client_1.prisma.submission.update({
        where: { id: submissionId },
        data: {
            score: data.score !== undefined ? data.score : submission.score,
            feedback: data.feedback !== undefined
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
