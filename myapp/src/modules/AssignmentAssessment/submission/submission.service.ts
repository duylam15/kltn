import { prisma } from "../../../prisma/client";

/**
 * 🔹 Lấy lịch sử nộp bài (tất cả các lần)
 */
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

/**
 * 🔹 Lấy bài nộp theo ID
 */
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
            student: {
                select: { id: true, user: true },
            },
        },
    });
}

/**
 * 🔹 Lấy bài nộp có điểm cao nhất cho 1 học sinh trong 1 bài tập
 */
export async function getBestSubmission(
    assignmentId: number,
    studentId: number
) {
    return prisma.submission.findFirst({
        where: { assignmentId, studentId },
        orderBy: [{ score: "desc" }, { submittedAt: "desc" }],
        include: {
            assignment: true,
            student: {
                select: { id: true, user: true },
            },
        },
    });
}

/**
 * 🔹 Tạo bài nộp mới
 */
export async function createSubmission(data: {
    assignmentId: number;
    studentId: number;
    filePath?: string;
    answerText?: string;
    attempt?: number;
}) {
    return prisma.submission.create({
        data: {
            ...data,
            submittedAt: new Date(),
        },
    });
}

/**
 * 🔹 Cập nhật bài nộp (ví dụ chấm điểm, thêm feedback)
 */
export async function updateSubmission(
    id: number,
    data: Partial<{
        score: number;
        maxScore: number;
        feedback: string;
        autoGraded: boolean;
        gradedAt: Date;
    }>
) {
    return prisma.submission.update({
        where: { id },
        data: {
            ...data,
            gradedAt: data.gradedAt ?? new Date(),
        },
    });
}

/**
 * 🔹 Xoá bài nộp
 */
export async function deleteSubmission(id: number) {
    return prisma.submission.delete({
        where: { id },
    });
}

/**
 * 🔹 Lấy tất cả bài nộp (admin xem)
 */
export async function getAllSubmissions() {
    return prisma.submission.findMany({
        orderBy: { submittedAt: "desc" },
        include: {
            assignment: {
                select: { id: true, title: true },
            },
            student: {
                select: { id: true, user: true },
            },
        },
    });
}
