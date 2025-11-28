import { prisma } from "../../../prisma/client";

export async function getSubmissionsHistory(
    assignmentId: number,
    studentId: number
) {
    return prisma.submission.findMany({
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

export async function getSubmissionById(id: number) {
    return prisma.submission.findUnique({
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
