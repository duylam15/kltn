import { prisma } from "../../prisma/client";
import { AssignmentType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function getAssignmentsBySection(sectionId: number) {
  return prisma.assignment.findMany({
    where: {
      sectionLinks: {
        some: { sectionId },
      },
    },
    include: {
      sectionLinks: {
        include: { section: true },
      },
      questions: true,
      submissions: true,
    },
  });
}

export async function createAssignment(data: {
    title: string;
    description?: string;
    type: AssignmentType;
    dueDate?: string | Date | null;
    maxScore?: number;
    passingScore?: number;
    timeLimit?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    showAnswersAfterSubmit?: boolean;
    allowLateSubmission?: boolean;
    createdBy: number;
    originalAssignmentId?: string | null;
}) {
    return prisma.assignment.create({
        data: {
            title: data.title,
            description: data.description,
            type: data.type,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            maxScore: data.maxScore ?? 100,
            passingScore: data.passingScore ?? null,
            timeLimit: data.timeLimit ?? null,
            maxAttempts: data.maxAttempts ?? 1,
            shuffleQuestions: data.shuffleQuestions ?? false,
            showAnswersAfterSubmit: data.showAnswersAfterSubmit ?? false,
            allowLateSubmission: data.allowLateSubmission ?? false,
            createdBy: data.createdBy,
            originalAssignmentId: data.originalAssignmentId ?? uuidv4(), // 👈 luôn đảm bảo có string
        },
    });
}


export async function updateAssignment(id: number, data: any) {
    return prisma.assignment.update({
        where: { id },
        data,
    });
}

export async function deleteAssignment(id: number) {
    return prisma.assignment.delete({ where: { id } });
}


export async function getAllAssignments(filter: any) {
    return prisma.assignment.findMany({
        where: {
            ...(filter.sectionId
                ? {
                      sectionLinks: {
                          some: { sectionId: Number(filter.sectionId) },
                      },
                  }
                : {}),
            ...(filter.type ? { type: filter.type as AssignmentType } : {}),
            ...(filter.dueBefore
                ? { dueDate: { lte: new Date(filter.dueBefore) } }
                : {}),
        },
        include: {
            sectionLinks: {
                include: { section: true }, // lấy thông tin section liên kết
            },
            questions: true, // lấy chi tiết câu hỏi
            submissions: true,
        },
    });
}


export async function getAssignmentById(id: number) {
    return prisma.assignment.findUnique({
        where: { id },
        include: { questions: true },
    });
}

export async function getSubmissionsByAssignment(id: number) {
    return prisma.submission.findMany({
        where: { assignmentId: id },
        include: { student: true },
    });
}

export async function getMyAssignments(studentId: number) {
    return prisma.assignment.findMany({
        where: {
            sectionLinks: {
                some: {
                    section: {
                        enrollments: {
                            some: { studentId },
                        },
                    },
                },
            },
        },
        include: {
            sectionLinks: {
                include: { section: true },
            },
        },
    });
}


export async function startAssignment(studentId: number, assignmentId: number) {
    return prisma.submission.create({
        data: {
            assignmentId,
            studentId,
            startedAt: new Date(),
        },
    });
}

export async function submitAssignment(
    studentId: number,
    assignmentId: number,
    answers: any[]
) {
    const submission = await prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        update: { completedAt: new Date() },
        create: {
            assignmentId,
            studentId,
            startedAt: new Date(),
            completedAt: new Date(),
        },
    });

    for (const ans of answers) {
        await prisma.submissionAnswer.upsert({
            where: {
                submissionId_questionId: {
                    submissionId: submission.id,
                    questionId: ans.questionId,
                },
            },
            update: {
                selectedChoices: ans.selectedChoices,
                essayAnswer: ans.essayAnswer,
                codeAnswer: ans.codeAnswer,
                language: ans.language,
            },
            create: {
                submissionId: submission.id,
                questionId: ans.questionId,
                selectedChoices: ans.selectedChoices,
                essayAnswer: ans.essayAnswer,
                codeAnswer: ans.codeAnswer,
                language: ans.language,
            },
        });
    }

    return submission;
}
