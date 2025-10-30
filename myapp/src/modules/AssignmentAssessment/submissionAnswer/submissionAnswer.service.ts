import { prisma } from "@/prisma/client";

export async function getAnswersBySubmission(submissionId: number) {
    return prisma.submissionAnswer.findMany({
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
