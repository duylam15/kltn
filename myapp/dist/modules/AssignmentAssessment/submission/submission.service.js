"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissionsHistory = getSubmissionsHistory;
exports.getSubmissionById = getSubmissionById;
exports.getBestSubmission = getBestSubmission;
exports.createSubmission = createSubmission;
exports.updateSubmission = updateSubmission;
exports.deleteSubmission = deleteSubmission;
exports.getAllSubmissions = getAllSubmissions;
const client_1 = require("../../../prisma/client");
/**
 * 🔹 Lấy lịch sử nộp bài (tất cả các lần)
 */
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
/**
 * 🔹 Lấy bài nộp theo ID
 */
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
            student: {
                select: { id: true, user: true },
            },
        },
    });
}
/**
 * 🔹 Lấy bài nộp có điểm cao nhất cho 1 học sinh trong 1 bài tập
 */
async function getBestSubmission(assignmentId, studentId) {
    return client_1.prisma.submission.findFirst({
        where: { assignmentId, studentId },
        orderBy: [{ score: "desc" }, { submittedAt: "desc" }],
        include: {
            assignment: true,
            student: {
                select: { id: true, user: true },
            },
        },
    });
}
/**
 * 🔹 Tạo bài nộp mới
 */
async function createSubmission(data) {
    return client_1.prisma.submission.create({
        data: {
            ...data,
            submittedAt: new Date(),
        },
    });
}
/**
 * 🔹 Cập nhật bài nộp (ví dụ chấm điểm, thêm feedback)
 */
async function updateSubmission(id, data) {
    return client_1.prisma.submission.update({
        where: { id },
        data: {
            ...data,
            gradedAt: data.gradedAt ?? new Date(),
        },
    });
}
/**
 * 🔹 Xoá bài nộp
 */
async function deleteSubmission(id) {
    return client_1.prisma.submission.delete({
        where: { id },
    });
}
/**
 * 🔹 Lấy tất cả bài nộp (admin xem)
 */
async function getAllSubmissions() {
    return client_1.prisma.submission.findMany({
        orderBy: { submittedAt: "desc" },
        include: {
            assignment: {
                select: { id: true, title: true },
            },
            student: {
                select: { id: true, user: true },
            },
        },
    });
}
