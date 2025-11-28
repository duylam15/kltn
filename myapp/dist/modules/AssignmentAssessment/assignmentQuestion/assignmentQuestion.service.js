"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQuestionToAssignment = addQuestionToAssignment;
exports.removeQuestionFromAssignment = removeQuestionFromAssignment;
exports.getQuestionsByAssignment = getQuestionsByAssignment;
exports.getAssignmentsByQuestion = getAssignmentsByQuestion;
const client_1 = require("../../../prisma/client");
// Gán câu hỏi vào bài tập
async function addQuestionToAssignment(assignmentId, questionId) {
    return client_1.prisma.assignmentQuestion.create({
        data: {
            assignmentId,
            questionId,
        },
        include: {
            question: {
                include: { choices: true, testCases: true },
            },
        },
    });
}
// Hủy gán câu hỏi khỏi bài tập
async function removeQuestionFromAssignment(assignmentId, questionId) {
    return client_1.prisma.assignmentQuestion.delete({
        where: {
            assignmentId_questionId: { assignmentId, questionId },
        },
    });
}
// Lấy toàn bộ câu hỏi của 1 bài tập
async function getQuestionsByAssignment(assignmentId) {
    return client_1.prisma.assignmentQuestion.findMany({
        where: { assignmentId },
        include: {
            question: {
                include: { choices: true, testCases: true },
            },
        },
    });
}
// Lấy toàn bộ bài tập có chứa 1 câu hỏi
async function getAssignmentsByQuestion(questionId) {
    return client_1.prisma.assignmentQuestion.findMany({
        where: { questionId },
        include: {
            assignment: true,
        },
    });
}
