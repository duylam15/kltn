"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultsBySubmission = getResultsBySubmission;
exports.getResultById = getResultById;
exports.updateSubmissionAnswer = updateSubmissionAnswer;
const client_1 = require("../../../prisma/client");
async function getResultsBySubmission(submissionId) {
    // 🔥 BỎ FILTER type: "coding" ĐỂ LẤY TẤT CẢ
    return client_1.prisma.submissionAnswer.findMany({
        where: {
            submissionId,
        },
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
        orderBy: {
            question: {
                order: "asc",
            },
        },
    });
}
async function getResultById(id) {
    return client_1.prisma.submissionAnswer.findUnique({
        where: { id },
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
    });
}
async function updateSubmissionAnswer(id, data) {
    const existing = await client_1.prisma.submissionAnswer.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new Error("Không tìm thấy submission answer");
    }
    const updated = await client_1.prisma.submissionAnswer.update({
        where: { id },
        data: {
            // Essay
            essayAnswer: data.essayAnswer !== undefined
                ? data.essayAnswer
                : existing.essayAnswer,
            // Code
            codeAnswer: data.codeAnswer !== undefined
                ? data.codeAnswer
                : existing.codeAnswer,
            language: data.language !== undefined
                ? data.language
                : existing.language,
            filePath: data.filePath !== undefined ? data.filePath : existing.filePath,
            isFolder: data.isFolder !== undefined ? data.isFolder : existing.isFolder,
            // Multiple-choice / true-false
            selectedChoices: data.selectedChoices !== undefined
                ? data.selectedChoices
                : existing.selectedChoices,
            // Scoring
            score: data.score !== undefined ? data.score : existing.score,
            maxScore: data.maxScore !== undefined ? data.maxScore : existing.maxScore,
            // Judge / logs
            judgeStatus: data.judgeStatus !== undefined
                ? data.judgeStatus
                : existing.judgeStatus,
            compileLog: data.compileLog !== undefined
                ? data.compileLog
                : existing.compileLog,
            stdoutLog: data.stdoutLog !== undefined
                ? data.stdoutLog
                : existing.stdoutLog,
            stderrLog: data.stderrLog !== undefined
                ? data.stderrLog
                : existing.stderrLog,
            testResults: data.testResults !== undefined
                ? data.testResults
                : existing.testResults,
        },
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
    });
    return updated;
}
