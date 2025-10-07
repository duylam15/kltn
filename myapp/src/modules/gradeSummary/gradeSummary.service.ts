import { prisma } from "../../prisma/client";

export const getSummary = async (studentId: number, sectionId: number) => {
    return prisma.gradeSummary.findUnique({
        where: {
            sectionId_studentId: {
                sectionId,
                studentId,
            },
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            studentCode: true,
                        },
                    },
                },
            },
        },
    });
};

export const getSectionSummaries = async (sectionId: number) => {
    return prisma.gradeSummary.findMany({
        where: { sectionId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            studentCode: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            totalScore: "desc",
        },
    });
};

export const calculateSummary = async (
    studentId: number,
    sectionId: number
) => {
    // Lấy tất cả điểm của sinh viên
    const grades = await prisma.grade.findMany({
        where: {
            studentId,
            column: {
                sectionId,
                isVisible: true,
            },
        },
        include: {
            column: true,
        },
    });

    // Lấy công thức tính điểm
    const formula = await prisma.gradeFormula.findUnique({
        where: { sectionId },
    });

    // Tính điểm theo trọng số
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const componentScores: any = {
        attendanceScore: null,
        assignmentScore: null,
        midtermScore: null,
        finalScore: null,
    };

    for (const grade of grades) {
        if (grade.score !== null && !grade.isExcused) {
            const normalizedScore = (grade.score / grade.column.maxScore) * 10; // Chuẩn hóa về thang 10
            totalWeightedScore += normalizedScore * grade.column.weight;
            totalWeight += grade.column.weight;

            // Lưu điểm thành phần
            if (grade.column.type === "attendance") {
                componentScores.attendanceScore = normalizedScore;
            } else if (grade.column.type === "midterm") {
                componentScores.midtermScore = normalizedScore;
            } else if (grade.column.type === "final") {
                componentScores.finalScore = normalizedScore;
            }
        }
    }

    const totalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Xếp loại
    const gradeScale = (formula?.gradeScale as any) ?? {
        A: 8.5,
        "B+": 8.0,
        B: 7.0,
        "C+": 6.5,
        C: 5.5,
        "D+": 5.0,
        D: 4.0,
        F: 0,
    };

    let finalGrade = "F";
    for (const [grade, threshold] of Object.entries(gradeScale)) {
        if (totalScore >= (threshold as number)) {
            finalGrade = grade;
            break;
        }
    }

    const isPassed = totalScore >= (formula?.passingScore ?? 5.0);

    // Lưu summary
    const summary = await prisma.gradeSummary.upsert({
        where: {
            sectionId_studentId: {
                sectionId,
                studentId,
            },
        },
        create: {
            sectionId,
            studentId,
            totalScore,
            finalGrade,
            gpa: totalScore,
            isPassed,
            isCompleted: true,
            ...componentScores,
        },
        update: {
            totalScore,
            finalGrade,
            gpa: totalScore,
            isPassed,
            isCompleted: true,
            ...componentScores,
        },
    });

    return summary;
};

export const recalculateAllSummaries = async (sectionId: number) => {
    const enrollments = await prisma.sectionEnrollment.findMany({
        where: { sectionId },
        select: { studentId: true },
    });

    const results = [];
    for (const { studentId } of enrollments) {
        try {
            const summary = await calculateSummary(studentId, sectionId);
            results.push({ studentId, success: true, summary });
        } catch (error: any) {
            results.push({ studentId, success: false, error: error.message });
        }
    }

    // Cập nhật ranking
    await updateRankings(sectionId);

    return {
        total: results.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
    };
};

const updateRankings = async (sectionId: number) => {
    const summaries = await prisma.gradeSummary.findMany({
        where: { sectionId },
        orderBy: { totalScore: "desc" },
    });

    for (let i = 0; i < summaries.length; i++) {
        await prisma.gradeSummary.update({
            where: { id: summaries[i].id },
            data: { rank: i + 1 },
        });
    }
};

export const getSectionStatistics = async (sectionId: number) => {
    const summaries = await prisma.gradeSummary.findMany({
        where: { sectionId },
        select: {
            id: true,
            totalScore: true,
            finalGrade: true,
            isPassed: true,
        },
    });

    if (summaries.length === 0) {
        return {
            total: 0,
            passed: 0,
            failed: 0,
            average: 0,
            gradeDistribution: {},
        };
    }

    const total = summaries.length;
    const passed = summaries.filter((s) => s.isPassed).length;
    const failed = total - passed;

    const totalScoreSum = summaries.reduce(
        (sum, s) => sum + (s.totalScore ?? 0),
        0
    );
    const average = totalScoreSum / total;

    // Phân bố xếp loại
    const gradeDistribution: any = {};
    summaries.forEach((s) => {
        const grade = s.finalGrade ?? "N/A";
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    return {
        total,
        passed,
        failed,
        passRate: (passed / total) * 100,
        average: Math.round(average * 100) / 100,
        gradeDistribution,
        highest: Math.max(...summaries.map((s) => s.totalScore ?? 0)),
        lowest: Math.min(...summaries.map((s) => s.totalScore ?? 0)),
    };
};
