import { prisma } from "../../prisma/client";

// question.service.ts
export async function createQuestion(data: any) {
  return prisma.question.create({
    data: {
      type: data.type,
      content: data.content,
      explanation: data.explanation,
      points: data.points,
      order: data.order,
      language: data.language,
      starterCode: data.starterCode,
      timeLimit: data.timeLimit,
      memoryLimit: data.memoryLimit,
      choices: data.choices ? { create: data.choices } : undefined,
      testCases: data.testCases ? { create: data.testCases } : undefined,
    },
    include: { choices: true, testCases: true },
  });
}


export async function updateQuestion(id: number, data: any) {
    return prisma.question.update({
        where: { id },
        data: {
            content: data.content,
            explanation: data.explanation,
            points: data.points,
            order: data.order,
            choices: data.choices
                ? {
                      deleteMany: { questionId: id },
                      create: data.choices,
                  }
                : undefined,
            testCases: data.testCases
                ? {
                      deleteMany: { questionId: id },
                      create: data.testCases,
                  }
                : undefined,
        },
        include: { choices: true, testCases: true },
    });
}

export async function deleteQuestion(id: number) {
    return prisma.question.delete({ where: { id } });
}


export async function getQuestionById(id: number) {
    return prisma.question.findUnique({
        where: { id },
        include: { choices: true, testCases: true },
    });
}

export async function getAllQuestions(filter: any) {
    return prisma.question.findMany({
        where: {
            ...(filter.type ? { type: filter.type } : {}),
            ...(filter.assignmentId
                ? { assignmentId: Number(filter.assignmentId) }
                : {}),
            ...(filter.search
                ? { content: { contains: filter.search, mode: "insensitive" } }
                : {}),
        },
        include: {
            choices: true,
            testCases: true,
        },
    });
}