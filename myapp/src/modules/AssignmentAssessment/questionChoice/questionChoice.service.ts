import { prisma } from "@/prisma/client";

export async function createChoice(questionId: number, data: any) {
    return prisma.questionChoice.create({
        data: {
            questionId,
            content: data.content,
            isCorrect: data.isCorrect,
            order: data.order,
        },
    });
}

export async function updateChoice(id: number, data: any) {
    return prisma.questionChoice.update({
        where: { id },
        data,
    });
}

export async function deleteChoice(id: number) {
    return prisma.questionChoice.delete({
        where: { id },
    });
}
