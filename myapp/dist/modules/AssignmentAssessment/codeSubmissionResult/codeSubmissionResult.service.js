"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodeResultsBySubmission = getCodeResultsBySubmission;
const client_1 = require("../../../prisma/client");
async function getCodeResultsBySubmission(submissionId) {
    return client_1.prisma.submissionAnswer.findMany({
        where: { submissionId },
        select: {
            id: true,
            questionId: true,
            judgeStatus: true,
            score: true,
            maxScore: true,
            compileLog: true,
            stdoutLog: true,
            stderrLog: true,
            testResults: true,
        },
    });
}
