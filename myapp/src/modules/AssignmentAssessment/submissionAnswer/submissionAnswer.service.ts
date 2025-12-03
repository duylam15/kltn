import { prisma } from "../../../prisma/client";

export async function getResultsBySubmission(submissionId: number) {
    // 🔥 BỎ FILTER type: "coding" ĐỂ LẤY TẤT CẢ
    return prisma.submissionAnswer.findMany({
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

export async function getResultById(id: number) {
    return prisma.submissionAnswer.findUnique({
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

export async function updateSubmissionAnswer(
    id: number,
    data: {
        essayAnswer?: string;
        codeAnswer?: string;
        language?: string;
        filePath?: string;
        isFolder?: boolean;
        selectedChoices?: number[];
        score?: number;
        maxScore?: number;
        judgeStatus?: string;
        compileLog?: string;
        stdoutLog?: string;
        stderrLog?: string;
        testResults?: any;
    }
) {
    const existing = await prisma.submissionAnswer.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new Error("Không tìm thấy submission answer");
    }

    const updated = await prisma.submissionAnswer.update({
        where: { id },
        data: {
            // Essay
            essayAnswer:
                data.essayAnswer !== undefined
                    ? data.essayAnswer
                    : existing.essayAnswer,

            // Code
            codeAnswer:
                data.codeAnswer !== undefined
                    ? data.codeAnswer
                    : existing.codeAnswer,

            language:
                data.language !== undefined
                    ? (data.language as any)
                    : existing.language,

            filePath:
                data.filePath !== undefined ? data.filePath : existing.filePath,

            isFolder:
                data.isFolder !== undefined ? data.isFolder : existing.isFolder,

            // Multiple-choice / true-false
            selectedChoices:
                data.selectedChoices !== undefined
                    ? data.selectedChoices
                    : existing.selectedChoices,

            // Scoring
            score: data.score !== undefined ? data.score : existing.score,

            maxScore:
                data.maxScore !== undefined ? data.maxScore : existing.maxScore,

            // Judge / logs
            judgeStatus:
                data.judgeStatus !== undefined
                    ? (data.judgeStatus as any)
                    : existing.judgeStatus,

            compileLog:
                data.compileLog !== undefined
                    ? data.compileLog
                    : existing.compileLog,

            stdoutLog:
                data.stdoutLog !== undefined
                    ? data.stdoutLog
                    : existing.stdoutLog,

            stderrLog:
                data.stderrLog !== undefined
                    ? data.stderrLog
                    : existing.stderrLog,

            testResults:
                data.testResults !== undefined
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
