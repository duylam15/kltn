"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnswersBySubmission = getAnswersBySubmission;
const client_1 = require("../../../prisma/client");
async function getAnswersBySubmission(submissionId) {
    return client_1.prisma.submissionAnswer.findMany({
        where: { submissionId },
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
