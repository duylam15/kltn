"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChoice = createChoice;
exports.updateChoice = updateChoice;
exports.deleteChoice = deleteChoice;
exports.getChoiceById = getChoiceById;
const client_1 = require("../../../prisma/client");
async function createChoice(questionId, data) {
    return client_1.prisma.questionChoice.create({
        data: {
            questionId,
            content: data.content,
            isCorrect: data.isCorrect,
            order: data.order,
        },
    });
}
async function updateChoice(id, data) {
    return client_1.prisma.questionChoice.update({
        where: { id },
        data,
    });
}
async function deleteChoice(id) {
    return client_1.prisma.questionChoice.delete({
        where: { id },
    });
}
async function getChoiceById(id) {
    return client_1.prisma.questionChoice.findUnique({
        where: { id },
    });
}
