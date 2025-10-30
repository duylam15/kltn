import { prisma } from "@/prisma/client";

export async function getCodeResultsBySubmission(submissionId: number) {
    return prisma.submissionAnswer.findMany({
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
