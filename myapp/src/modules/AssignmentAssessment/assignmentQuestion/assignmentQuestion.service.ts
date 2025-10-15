import { prisma } from "@/prisma/client";

// Gán câu hỏi vào bài tập
export async function addQuestionToAssignment(
    assignmentId: number,
    questionId: number
) {
    return prisma.assignmentQuestion.create({
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
export async function removeQuestionFromAssignment(
    assignmentId: number,
    questionId: number
) {
    return prisma.assignmentQuestion.delete({
        where: {
            assignmentId_questionId: { assignmentId, questionId },
        },
    });
}

// Lấy toàn bộ câu hỏi của 1 bài tập
export async function getQuestionsByAssignment(assignmentId: number) {
    return prisma.assignmentQuestion.findMany({
        where: { assignmentId },
        include: {
            question: {
                include: { choices: true, testCases: true },
            },
        },
    });
}

// Lấy toàn bộ bài tập có chứa 1 câu hỏi
export async function getAssignmentsByQuestion(questionId: number) {
    return prisma.assignmentQuestion.findMany({
        where: { questionId },
        include: {
            assignment: true,
        },
    });
}
